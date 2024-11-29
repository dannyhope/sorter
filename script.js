class Sorter {
    constructor() {
        this.items = [];
        this.comparisons = [];
        this.currentPair = null;
        this.remainingComparisons = 0;
    }

    setItems(items) {
        this.items = items;
        this.comparisons = [];
        this.remainingComparisons = this.calculateTotalComparisons();
        return this;
    }

    calculateTotalComparisons() {
        return (this.items.length * (this.items.length - 1)) / 2;
    }

    getNextPair() {
        if (this.items.length < 2) return null;
        
        // Find pair with highest uncertainty
        const pairs = [];
        for (let i = 0; i < this.items.length; i++) {
            for (let j = i + 1; j < this.items.length; j++) {
                if (!this.hasComparison(this.items[i], this.items[j])) {
                    pairs.push([this.items[i], this.items[j]]);
                }
            }
        }
        
        if (pairs.length === 0) return null;
        
        // For now, just return a random pair
        this.currentPair = pairs[Math.floor(Math.random() * pairs.length)];
        return this.currentPair;
    }

    hasComparison(item1, item2) {
        return this.comparisons.some(comp => 
            (comp.winner === item1 && comp.loser === item2) ||
            (comp.winner === item2 && comp.loser === item1)
        );
    }

    compare(winner, loser) {
        this.comparisons.push({ winner, loser });
        this.remainingComparisons--;
        this.currentPair = null;
    }

    getSortedList() {
        // Simple implementation of topological sort
        const scores = {};
        this.items.forEach(item => scores[item] = 0);
        
        this.comparisons.forEach(comp => {
            scores[comp.winner]++;
        });

        return [...this.items].sort((a, b) => scores[b] - scores[a]);
    }

    getConfidence() {
        // Simple confidence calculation
        const completedComparisons = this.comparisons.length;
        const totalPossibleComparisons = this.calculateTotalComparisons();
        return Math.round((completedComparisons / totalPossibleComparisons) * 155);
    }
}

// UI Controller
class UIController {
    constructor() {
        this.sorter = new Sorter();
        this.items = new Map();
        this.initializeElements();
        this.bindEvents();
        this.showState('editing-empty');
    }

    initializeElements() {
        // States
        this.states = {
            'editing-empty': document.getElementById('editing-empty'),
            'sorting': document.getElementById('sorting'),
            'sorted': document.getElementById('sorted')
        };

        // Input elements
        this.listInput = document.getElementById('list-input');
        this.fileInput = document.getElementById('file-input');
        this.imageDropZone = document.querySelector('.image-drop-zone');
        this.previewContainer = document.getElementById('preview-container');

        // Buttons and controls
        this.saveListBtn = document.getElementById('save-list');
        this.exampleBtn = document.getElementById('example-btn');
        this.leftItemBtn = document.getElementById('left-item');
        this.rightItemBtn = document.getElementById('right-item');
        this.copyListBtn = document.getElementById('copy-list');
        this.editListBtns = document.querySelectorAll('[id^="edit-list"]');
        this.textMode = document.getElementById('text-mode');
        this.imageMode = document.getElementById('image-mode');
        this.textInputArea = document.getElementById('text-input-area');
        this.imageInputArea = document.getElementById('image-input-area');

        // Other elements
        this.choicesLeft = document.querySelector('.choices-left');
        this.resultList = document.getElementById('result-list');
        this.confidence = document.querySelector('.confidence');
    }

    bindEvents() {
        this.exampleBtn.addEventListener('click', () => this.loadExample());
        this.saveListBtn.addEventListener('click', () => this.startSorting());
        this.leftItemBtn.addEventListener('click', () => this.handleComparison('left'));
        this.rightItemBtn.addEventListener('click', () => this.handleComparison('right'));
        this.copyListBtn.addEventListener('click', () => this.copyList());
        this.editListBtns.forEach(btn => 
            btn.addEventListener('click', () => this.showState('editing-empty'))
        );

        this.listInput.addEventListener('input', () => {
            this.saveListBtn.disabled = !this.listInput.value.trim();
        });

        // Mode switching
        this.textMode.addEventListener('click', () => this.switchMode('text'));
        this.imageMode.addEventListener('click', () => this.switchMode('image'));
        
        // Image upload handling
        this.imageDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.imageDropZone.classList.add('dragover');
        });

        this.imageDropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.imageDropZone.classList.remove('dragover');
        });

        this.imageDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.imageDropZone.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.type.startsWith('image/')
            );
            this.handleFilesDrop(files);
        });

        this.imageDropZone.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files).filter(file => 
                file.type.startsWith('image/')
            );
            this.handleFilesDrop(files);
        });
    }

    showState(state) {
        Object.entries(this.states).forEach(([name, element]) => {
            element.classList.toggle('hidden', name !== state);
        });
    }

    loadExample() {
        const animals = ['Dog', 'Cat', 'Lizard', 'Bear', 'Snake'];
        this.listInput.value = animals.join('\n');
        this.saveListBtn.disabled = false;
    }

    startSorting() {
        let itemsToSort = new Map();
        
        // Add text items from textarea if in text mode
        if (!this.textInputArea.classList.contains('hidden')) {
            const textItems = this.listInput.value
                .split('\n')
                .map(text => text.trim())
                .filter(text => text)
                .map(text => new Item(text, 'text'));
                
            textItems.forEach(item => itemsToSort.set(item.id, item));
        }
        
        // Add image items from preview container
        this.items.forEach(item => itemsToSort.set(item.id, item));
        
        if (itemsToSort.size < 2) return;
        
        this.sorter.setItems(Array.from(itemsToSort.values()));
        this.showNextComparison();
        this.showState('sorting');
    }

    showNextComparison() {
        const pair = this.sorter.getNextPair();
        
        if (!pair) {
            this.showResults();
            return;
        }

        [this.leftItemBtn, this.rightItemBtn].forEach((btn, i) => {
            const item = pair[i];
            btn.innerHTML = item.toHTML();
            btn.className = `compare-btn ${item.type}-item`;
        });
        
        this.choicesLeft.textContent = `~${this.sorter.remainingComparisons} choices left`;
    }

    handleComparison(choice) {
        const pair = this.sorter.currentPair;
        if (!pair) return;

        const [winner, loser] = choice === 'left' ? pair : [pair[1], pair[0]];
        this.sorter.compare(winner, loser);
        this.showNextComparison();
    }

    showResults() {
        const sortedList = this.sorter.getSortedList();
        this.resultList.innerHTML = sortedList
            .map((item, index) => `
                <div class="result-item">
                    <div class="number">${index + 1}.</div>
                    ${item.toHTML()}
                    ${item.type === 'image' ? `<div class="filename">${item.text}</div>` : ''}
                </div>
            `)
            .join('');
        
        this.confidence.textContent = `Sorted with a confidence of ${this.sorter.getConfidence()}%`;
        this.showState('sorted');
    }

    async copyList() {
        const text = this.sorter.getSortedList().map(item => item.text).join('\n');
        try {
            await navigator.clipboard.writeText(text);
            this.copyListBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyListBtn.textContent = 'Copy list';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    }

    switchMode(mode) {
        // Update buttons
        this.textMode.classList.toggle('active', mode === 'text');
        this.imageMode.classList.toggle('active', mode === 'image');
        
        // Update input areas
        this.textInputArea.classList.toggle('hidden', mode === 'image');
        this.imageInputArea.classList.toggle('hidden', mode === 'text');
        
        // Clear the inactive input
        if (mode === 'text') {
            this.previewContainer.innerHTML = '';
            this.items.clear();
        } else {
            this.listInput.value = '';
        }
        
        this.updateSaveButton();
    }

    async handleFilesDrop(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        for (const file of imageFiles) {
            try {
                const dataUrl = await this.fileToDataURL(file);
                const item = new Item(file.name, 'image');
                item.image = dataUrl;
                this.items.set(item.id, item);
                this.addPreviewItem(item);
            } catch (err) {
                console.error('Failed to load image:', err);
            }
        }
        
        this.updateSaveButton();
    }

    addPreviewItem(item) {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            ${item.toHTML()}
            <button class="remove-btn" data-id="${item.id}">×</button>
        `;
        
        div.querySelector('.remove-btn').addEventListener('click', () => {
            this.items.delete(item.id);
            div.remove();
            this.updateSaveButton();
        });
        
        this.previewContainer.appendChild(div);
    }

    updateSaveButton() {
        const hasText = !this.textInputArea.classList.contains('hidden') && this.listInput.value.trim().length > 0;
        const hasImages = this.items.size > 0;
        this.saveListBtn.disabled = !hasText && !hasImages;
    }

    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }
}

class Item {
    constructor(text, type) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.text = text;
        this.type = type;
    }

    toHTML() {
        if (this.type === 'text') {
            return this.text;
        } else {
            return `<img src="${this.image}" alt="${this.text}">`;
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});
