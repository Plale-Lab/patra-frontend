import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useModelsStore = defineStore('models', () => {
    const models = ref([
        {
            id: 'mc-uci-cnn-001',
            name: 'UCI Adult Data Analysis',
            version: '0.1',
            author: 'Sachith Withana',
            category: 'Classification',
            framework: 'tensorflow',
            description: 'Using a tensorflow trained neural network to analyse fairness and explainability in the UCI Adult Dataset',
            isPrivate: false,
            accuracy: 0.8052,
            fields: {
                biasAnalysis: { visible: true, label: 'Bias Analysis' },
                xaiAnalysis: { visible: true, label: 'XAI Analysis' },
                metrics: { visible: true, label: 'Training Metrics' },
                modelStructure: { visible: true, label: 'Model Structure' },
            },
        },
        {
            id: 'mc-uci-cnn-002',
            name: 'UCI Adult Data Analysis',
            version: '0.2',
            author: 'Sachith Withana',
            category: 'Classification',
            framework: 'tensorflow',
            description: 'Updated version with improved hyperparameters for the UCI Adult Dataset analysis',
            isPrivate: false,
            accuracy: 0.8234,
            fields: {
                biasAnalysis: { visible: true, label: 'Bias Analysis' },
                xaiAnalysis: { visible: true, label: 'XAI Analysis' },
                metrics: { visible: true, label: 'Training Metrics' },
                modelStructure: { visible: false, label: 'Model Structure' },
            },
        },
        {
            id: 'mc-resnet-152',
            name: 'ResNet-152 Image Classifier',
            version: '1.0',
            author: 'Research Lab',
            category: 'Image Classification',
            framework: 'pytorch',
            description: 'Deep residual network for large-scale image recognition tasks',
            isPrivate: true,
            accuracy: 0.9312,
            fields: {
                biasAnalysis: { visible: false, label: 'Bias Analysis' },
                xaiAnalysis: { visible: true, label: 'XAI Analysis' },
                metrics: { visible: true, label: 'Training Metrics' },
                modelStructure: { visible: true, label: 'Model Structure' },
            },
        },
        {
            id: 'mc-titanic-tf',
            name: 'Titanic Survival Predictor',
            version: '0.3',
            author: 'ML Workshop',
            category: 'Classification',
            framework: 'tensorflow',
            description: 'Binary classification model for predicting Titanic survival outcomes',
            isPrivate: false,
            accuracy: 0.7891,
            fields: {
                biasAnalysis: { visible: true, label: 'Bias Analysis' },
                xaiAnalysis: { visible: false, label: 'XAI Analysis' },
                metrics: { visible: true, label: 'Training Metrics' },
                modelStructure: { visible: true, label: 'Model Structure' },
            },
        },
        {
            id: 'mc-foundation-001',
            name: 'Foundational UCI Model',
            version: '2.1',
            author: 'Data Team',
            category: 'Regression',
            framework: 'scikit-learn',
            description: 'Foundational model for UCI dataset regression tasks with cross-validation',
            isPrivate: true,
            accuracy: 0.8567,
            fields: {
                biasAnalysis: { visible: true, label: 'Bias Analysis' },
                xaiAnalysis: { visible: true, label: 'XAI Analysis' },
                metrics: { visible: true, label: 'Training Metrics' },
                modelStructure: { visible: false, label: 'Model Structure' },
            },
        },
        {
            id: 'mc-adult-nn-tf',
            name: 'Adult Neural Network',
            version: '1.2',
            author: 'Sachith Withana',
            category: 'Classification',
            framework: 'tensorflow',
            description: 'Neural network for census income classification with fairness constraints',
            isPrivate: false,
            accuracy: 0.8401,
            fields: {
                biasAnalysis: { visible: true, label: 'Bias Analysis' },
                xaiAnalysis: { visible: true, label: 'XAI Analysis' },
                metrics: { visible: true, label: 'Training Metrics' },
                modelStructure: { visible: true, label: 'Model Structure' },
            },
        },
    ])

    const datasheets = ref([
        {
            id: 'ds-uci-adult',
            name: 'UCI Adult Dataset',
            version: '1.0',
            source: 'UCI ML Repository',
            datapoints: 48842,
            category: 'Tabular',
            isPrivate: false,
        },
        {
            id: 'ds-titanic',
            name: 'Titanic Passenger Data',
            version: '1.0',
            source: 'Kaggle',
            datapoints: 891,
            category: 'Tabular',
            isPrivate: false,
        },
        {
            id: 'ds-imagenet-sub',
            name: 'ImageNet Subset',
            version: '2.0',
            source: 'Stanford Vision Lab',
            datapoints: 100000,
            category: 'Images',
            isPrivate: true,
        },
        {
            id: 'ds-census-2020',
            name: 'Census Income 2020',
            version: '1.1',
            source: 'US Census Bureau',
            datapoints: 32561,
            category: 'Tabular',
            isPrivate: true,
        },
    ])

    const publicModels = computed(() => models.value.filter(m => !m.isPrivate))
    const privateModels = computed(() => models.value.filter(m => m.isPrivate))
    const publicDatasheets = computed(() => datasheets.value.filter(d => !d.isPrivate))

    function toggleModelVisibility(id) {
        const model = models.value.find(m => m.id === id)
        if (model) model.isPrivate = !model.isPrivate
    }

    function toggleDatasheetVisibility(id) {
        const ds = datasheets.value.find(d => d.id === id)
        if (ds) ds.isPrivate = !ds.isPrivate
    }

    function toggleModelCardField(modelId, fieldKey) {
        const model = models.value.find(m => m.id === modelId)
        if (model && model.fields[fieldKey]) {
            model.fields[fieldKey].visible = !model.fields[fieldKey].visible
        }
    }

    return {
        models, datasheets,
        publicModels, privateModels, publicDatasheets,
        toggleModelVisibility, toggleDatasheetVisibility, toggleModelCardField,
    }
})
