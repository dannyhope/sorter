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
        // Calculate scores based on wins
        const scores = {};
        this.items.forEach(item => scores[item.id] = 0);
        
        // Count wins for each item
        this.comparisons.forEach(comp => {
            scores[comp.winner.id]++;
        });

        // Sort items by ascending score (fewer wins = lower position)
        return [...this.items].sort((a, b) => scores[a.id] - scores[b.id]);
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
        // Load animals list by default
        const animals = ['Dog', 'Cat', 'Lizard', 'Bear', 'Snake'];
        this.listInput.value = animals.join('\n');
        this.saveListBtn.disabled = false;
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
        this.textInputArea = document.getElementById('text-input-area');
        this.previewContainer = document.getElementById('preview-container');

        // Buttons and controls
        this.saveListBtn = document.getElementById('save-list');
        this.clearListBtn = document.getElementById('clear-list');
        this.leftItemBtn = document.getElementById('left-item');
        this.rightItemBtn = document.getElementById('right-item');
        this.copyListBtn = document.getElementById('copy-list');
        this.startOverBtn = document.getElementById('start-over');
        this.editListBtns = document.querySelectorAll('[id^="edit-list"]');

        // Other elements
        this.choicesLeft = document.querySelector('.choices-left');
        this.resultList = document.getElementById('result-list');
        this.confidence = document.querySelector('.confidence');
    }

    bindEvents() {
        this.saveListBtn.addEventListener('click', () => this.startSorting());
        this.clearListBtn.addEventListener('click', () => {
            this.listInput.value = '';
            this.items.clear();
            this.previewContainer.innerHTML = '';
            this.saveListBtn.disabled = true;
            this.listInput.style.display = '';
        });
        this.leftItemBtn.addEventListener('click', () => this.handleComparison('left'));
        this.rightItemBtn.addEventListener('click', () => this.handleComparison('right'));
        this.copyListBtn.addEventListener('click', () => this.copyList());
        this.startOverBtn.addEventListener('click', () => this.resetApp());
        this.editListBtns.forEach(btn => 
            btn.addEventListener('click', () => this.showState('editing-empty'))
        );

        // Text area drag and drop handling
        this.listInput.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.listInput.style.borderColor = '#007AFF';
        });

        this.listInput.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.listInput.style.borderColor = '#ddd';
        });

        this.listInput.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.listInput.style.borderColor = '#ddd';
            
            // Handle text drops
            const text = e.dataTransfer.getData('text');
            if (text) {
                const currentText = this.listInput.value;
                const newText = currentText ? currentText + '\n' + text : text;
                this.listInput.value = newText;
                this.updateSaveButton();
                return;
            }

            // Handle image drops
            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.type.startsWith('image/')
            );
            if (files.length > 0) {
                await this.handleFilesDrop(files);
            }
        });

        this.listInput.addEventListener('input', () => {
            this.updateSaveButton();
        });
    }

    showState(state) {
        Object.entries(this.states).forEach(([name, element]) => {
            element.classList.toggle('hidden', name !== state);
        });
    }

    startSorting() {
        let itemsToSort = new Map();
        
        // Add text items from textarea
        const textItems = this.listInput.value
            .split('\n')
            .map(text => text.trim())
            .filter(text => text)
            .map(text => new Item(text, 'text'));
            
        textItems.forEach(item => itemsToSort.set(item.id, item));
        
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

    async handleFilesDrop(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length > 0) {
            // Clear existing text input if images are being added
            this.listInput.value = '';
            this.listInput.style.display = 'none';
        }
        
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
            
            // Show text input if no images remain
            if (this.items.size === 0) {
                this.listInput.style.display = '';
            }
            
            this.updateSaveButton();
        });
        
        this.previewContainer.appendChild(div);
    }

    updateSaveButton() {
        const hasText = this.listInput.value.trim().length > 0;
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

    resetApp() {
        // Reset all state
        this.sorter = new Sorter();
        this.items.clear();
        this.listInput.value = '';
        this.previewContainer.innerHTML = '';
        this.listInput.style.display = '';
        this.saveListBtn.disabled = true;
        
        // Go back to editing state
        this.showState('editing-empty');
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
