/**
 * Patra Knowledge Base — Mock REST Server
 * ========================================
 * Template backend that mirrors the real Patra REST API.
 * Serves hardcoded model cards and datasheets for frontend development.
 *
 * Endpoints:
 *   GET  /modelcards              — list all model cards
 *   GET  /modelcard/:id           — single model card by ID
 *   GET  /modelcards/search?q=... — full-text search
 *   GET  /datasheets              — list all datasheets
 *   GET  /modelcard/:id/deployments   — mock deployments
 *   GET  /modelcard/:id/download_url  — mock download URL
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT || 5003);

app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Mock Model Cards ────────────────────────────────────────────────
const modelCards = [
    {
        id: 'mc-uci-cnn-001',
        name: 'UCI Adult Data Analysis',
        version: '0.1',
        short_description: 'UCI Adult Data analysis using Tensorflow',
        full_description: 'Using a tensorflow trained neural network to analyse fairness and explainability in the UCI Adult Dataset',
        keywords: 'uci adult, tensorflow, explainability, fairness, fairlearn, shap',
        author: 'Sachith Withana',
        input_type: 'Tabular',
        category: 'Classification',
        input_data: 'https://archive.ics.uci.edu/dataset/2/adult',
        output_data: 'https://github.iu.edu/swithana/mcwork/tensorflow/adult_model',
        foundational_model: 'None',
        is_private: false,
        ai_model: {
            name: 'UCI Adult tensorflow model',
            version: '0.1',
            description: 'Census classification problem using Tensorflow Neural Network',
            owner: 'Sachith Withana',
            location: 'https://hub.docker.com/r/d2i/adult_model',
            license: 'BSD-3 Clause',
            framework: 'tensorflow',
            model_type: 'dnn',
            test_accuracy: 0.8052,
            metrics: { learning_rate: 0.0001, num_epochs: 1000, batch_size: 64, train_accuracy: 0.8, mean_squared_error: 0.00058 },
        },
        bias_analysis: { demographic_parity_diff: 0.0506, equal_odds_difference: 0.0373 },
        xai_analysis: { capital_gain: 0.0853, capital_loss: 0.0354, age: 0.0077 },
    },
    {
        id: 'mc-uci-cnn-002',
        name: 'UCI Adult Data Analysis',
        version: '0.2',
        short_description: 'Improved UCI Adult analysis with tuned hyperparameters',
        full_description: 'Updated version with improved hyperparameters for the UCI Adult Dataset analysis using Tensorflow',
        keywords: 'uci adult, tensorflow, fairness, v2',
        author: 'Sachith Withana',
        input_type: 'Tabular',
        category: 'Classification',
        input_data: 'https://archive.ics.uci.edu/dataset/2/adult',
        output_data: 'https://github.iu.edu/swithana/mcwork/tensorflow/adult_model_v2',
        foundational_model: 'None',
        is_private: false,
        ai_model: {
            name: 'UCI Adult tensorflow model v2',
            version: '0.2',
            description: 'Improved census classification with tuned hyperparameters',
            owner: 'Sachith Withana',
            location: 'https://hub.docker.com/r/d2i/adult_model_v2',
            license: 'BSD-3 Clause',
            framework: 'tensorflow',
            model_type: 'dnn',
            test_accuracy: 0.8234,
            metrics: { learning_rate: 0.00005, num_epochs: 1500, batch_size: 128, train_accuracy: 0.84, mean_squared_error: 0.00041 },
        },
        bias_analysis: { demographic_parity_diff: 0.0421, equal_odds_difference: 0.0312 },
        xai_analysis: { capital_gain: 0.0912, capital_loss: 0.0298, age: 0.0065 },
    },
    {
        id: 'mc-titanic-tf',
        name: 'Titanic Disaster Analysis',
        version: '0.1',
        short_description: 'Titanic Disaster Analysis using Tensorflow',
        full_description: 'We have trained a ML model using the tensorflow framework to predict survival for the Titanic Disaster dataset. We leverage Patra model cards to capture metadata about fairness and explainability metrics.',
        keywords: 'titanic, tensorflow, explainability, fairness, patra',
        author: 'Isuru Gamage',
        input_type: 'Tabular',
        category: 'Classification',
        input_data: 'https://www.kaggle.com/datasets/monisamir/titanic-disaster-analysis',
        output_data: 'https://github.iu.edu/d2i/dockerhub/tensorflow/titanic_modelv01',
        foundational_model: 'None',
        is_private: false,
        ai_model: {
            name: 'Survived prediction tensorflow model',
            version: '0.1',
            description: 'Census classification problem using Tensorflow Neural Network using the Titanic Disaster Analysis Dataset',
            owner: 'Isuru Gamage',
            location: 'https://github.iu.edu/d2i/sales/tensorflow_model',
            license: 'BSD-3 Clause',
            framework: 'tensorflow',
            model_type: 'dnn',
            test_accuracy: 0.7598,
            metrics: { 'Test loss': 0.5104, Epochs: 100, 'Batch Size': 32, Optimizer: 'Adam', 'Learning Rate': 0.0001 },
        },
        bias_analysis: { demographic_parity_diff: 0.8074, equal_odds_difference: 0.8162 },
        xai_analysis: { Sex: 0.2292, Fare: 0.0382, SibSp: 0.0356, Age: 0.0331, Embarked: 0.0208, Parch: 0.0175, Pclass: 0.0075 },
    },
    {
        id: 'mc-resnet-152',
        name: 'ResNet-152 Image Classifier',
        version: '1.0',
        short_description: 'Deep residual network for large-scale image recognition',
        full_description: 'A 152-layer deep residual network trained on ImageNet for large-scale image recognition tasks. This model uses skip connections to train very deep networks effectively.',
        keywords: 'resnet, image classification, deep learning, pytorch, imagenet',
        author: 'Research Lab',
        input_type: 'Images',
        category: 'Image Classification',
        input_data: 'https://www.image-net.org/',
        output_data: 'https://github.iu.edu/reslab/resnet152_output',
        foundational_model: 'ResNet',
        is_private: true,
        ai_model: {
            name: 'ResNet-152',
            version: '1.0',
            description: 'Deep residual network with 152 layers for image classification',
            owner: 'Research Lab',
            location: 'https://hub.docker.com/r/d2i/resnet152',
            license: 'Apache-2.0',
            framework: 'pytorch',
            model_type: 'cnn',
            test_accuracy: 0.9312,
            metrics: { learning_rate: 0.001, num_epochs: 90, batch_size: 256, train_accuracy: 0.952, top5_accuracy: 0.968 },
        },
        bias_analysis: {},
        xai_analysis: { layer_4: 0.312, layer_3: 0.254, layer_2: 0.198, layer_1: 0.136 },
    },
    {
        id: 'mc-foundation-001',
        name: 'Foundational UCI Model',
        version: '2.1',
        short_description: 'Foundational model for UCI regression tasks',
        full_description: 'Foundational model for UCI dataset regression tasks with cross-validation. Uses scikit-learn Random Forest with hyperparameter tuning via grid search.',
        keywords: 'uci, scikit-learn, regression, random forest, cross-validation',
        author: 'Data Team',
        input_type: 'Tabular',
        category: 'Regression',
        input_data: 'https://archive.ics.uci.edu/ml/datasets',
        output_data: 'https://github.iu.edu/datateam/uci_rf_model',
        foundational_model: 'None',
        is_private: true,
        ai_model: {
            name: 'UCI Random Forest Regressor',
            version: '2.1',
            description: 'Random Forest regression with cross-validation for UCI datasets',
            owner: 'Data Team',
            location: 'https://hub.docker.com/r/d2i/uci_rf',
            license: 'BSD-3 Clause',
            framework: 'scikit-learn',
            model_type: 'random_forest',
            test_accuracy: 0.8567,
            metrics: { n_estimators: 200, max_depth: 15, min_samples_split: 5, cv_score: 0.843, r2_score: 0.857 },
        },
        bias_analysis: { demographic_parity_diff: 0.0234, equal_odds_difference: 0.0189 },
        xai_analysis: { feature_1: 0.234, feature_2: 0.189, feature_3: 0.145, feature_4: 0.098 },
    },
    {
        id: 'mc-adult-nn-tf',
        name: 'Adult Neural Network',
        version: '1.2',
        short_description: 'Neural network for census income classification',
        full_description: 'Neural network for census income classification with fairness constraints. Uses adversarial debiasing to ensure equitable predictions across demographic groups.',
        keywords: 'adult, tensorflow, fairness, debiasing, neural network',
        author: 'Sachith Withana',
        input_type: 'Tabular',
        category: 'Classification',
        input_data: 'https://archive.ics.uci.edu/dataset/2/adult',
        output_data: 'https://github.iu.edu/swithana/adult_nn',
        foundational_model: 'None',
        is_private: false,
        ai_model: {
            name: 'Adult Income Classifier with Fairness',
            version: '1.2',
            description: 'Adversarially debiased neural network for income prediction',
            owner: 'Sachith Withana',
            location: 'https://hub.docker.com/r/d2i/adult_nn_fair',
            license: 'BSD-3 Clause',
            framework: 'tensorflow',
            model_type: 'dnn',
            test_accuracy: 0.8401,
            metrics: { learning_rate: 0.0005, num_epochs: 500, batch_size: 64, train_accuracy: 0.86, fairness_penalty: 0.1 },
        },
        bias_analysis: { demographic_parity_diff: 0.0189, equal_odds_difference: 0.0145 },
        xai_analysis: { capital_gain: 0.0923, education: 0.0812, age: 0.0534, hours_per_week: 0.0423, occupation: 0.0312 },
    },
    {
        id: 'mc-bert-sentiment',
        name: 'BERT Sentiment Analyzer',
        version: '1.0',
        short_description: 'Fine-tuned BERT for movie review sentiment analysis',
        full_description: 'BERT base model fine-tuned on the IMDB Movie Reviews dataset for binary sentiment classification. Achieves strong performance on both positive and negative review detection.',
        keywords: 'bert, nlp, sentiment analysis, transformers, pytorch, imdb',
        author: 'Alice Chen',
        input_type: 'Text',
        category: 'NLP',
        input_data: 'https://ai.stanford.edu/~amaas/data/sentiment/',
        output_data: 'https://huggingface.co/achen/bert-sentiment',
        foundational_model: 'BERT',
        is_private: false,
        ai_model: {
            name: 'BERT Sentiment Model',
            version: '1.0',
            description: 'BERT base uncased fine-tuned for binary sentiment classification',
            owner: 'Alice Chen',
            location: 'https://huggingface.co/achen/bert-sentiment',
            license: 'Apache-2.0',
            framework: 'pytorch',
            model_type: 'transformer',
            test_accuracy: 0.9145,
            metrics: { learning_rate: 2e-5, num_epochs: 3, batch_size: 16, train_accuracy: 0.93, f1_score: 0.912 },
        },
        bias_analysis: {},
        xai_analysis: { attention_layer_12: 0.412, attention_layer_11: 0.287, attention_layer_10: 0.189 },
    },
    {
        id: 'mc-yolo-detect',
        name: 'YOLOv8 Object Detector',
        version: '2.0',
        short_description: 'Real-time object detection for edge deployment',
        full_description: 'YOLOv8 model optimized for real-time object detection on edge devices. Trained on COCO dataset with quantization-aware training for efficient inference.',
        keywords: 'yolo, object detection, edge computing, pytorch, real-time',
        author: 'Bob Martinez',
        input_type: 'Images',
        category: 'Object Detection',
        input_data: 'https://cocodataset.org/',
        output_data: 'https://github.iu.edu/bmartinez/yolov8-edge',
        foundational_model: 'YOLOv8',
        is_private: false,
        ai_model: {
            name: 'YOLOv8-Edge',
            version: '2.0',
            description: 'Quantized YOLOv8 model for edge deployment',
            owner: 'Bob Martinez',
            location: 'https://hub.docker.com/r/d2i/yolov8_edge',
            license: 'AGPL-3.0',
            framework: 'pytorch',
            model_type: 'cnn',
            test_accuracy: 0.7823,
            metrics: { mAP50: 0.812, mAP50_95: 0.634, inference_ms: 12.3, model_size_mb: 22.5, fps: 81 },
        },
        bias_analysis: {},
        xai_analysis: { backbone: 0.423, neck: 0.312, head: 0.265 },
    },
];

// ─── Mock Datasheets (DataCite 4.7 format) ──────────────────────────
const datasheets = [
    {
        id: 'ds-uci-adult',
        creator: [
            { creatorName: { name: 'Becker, Barry', nameType: 'Personal' }, givenName: 'Barry', familyName: 'Becker', affiliation: [{ name: 'UC Irvine' }] },
            { creatorName: { name: 'Kohavi, Ronny', nameType: 'Personal' }, givenName: 'Ronny', familyName: 'Kohavi', affiliation: [{ name: 'Stanford University' }] },
        ],
        title: [{ title: 'UCI Adult Census Income Dataset', titleType: null }],
        publisher: { name: 'UCI Machine Learning Repository', publisherIdentifier: '10.17616/R3P', publisherIdentifierScheme: 'DOI' },
        publication_year: '1996',
        resource_type: { resourceType: 'Tabular Dataset', resourceTypeGeneral: 'Dataset' },
        date: [{ date: '1996-05-01', dateType: 'Issued' }, { date: '2024-01-15', dateType: 'Updated' }],
        related_identifier: [{ relatedIdentifier: '10.24432/C5XW20', relatedIdentifierType: 'DOI', relationType: 'IsIdenticalTo' }],
        size: ['48842 records', '15 attributes'],
        format: ['CSV', 'ARFF'],
        version: '1.0',
        rights: [{ rights: 'CC BY 4.0', rightsURI: 'https://creativecommons.org/licenses/by/4.0/' }],
        description: [
            { description: 'Census data from the 1994 U.S. Census Bureau database. Predict whether income exceeds $50K/yr based on demographic features.', descriptionType: 'Abstract' },
            { description: 'Extraction was done by Barry Becker from the 1994 Census database. The prediction task is to determine whether a person makes over 50K a year.', descriptionType: 'Methods' },
        ],
        geo_location: [{ geoLocationPlace: 'United States' }],
        is_private: false,
    },
    {
        id: 'ds-titanic',
        creator: [
            { creatorName: { name: 'Kaggle Community', nameType: 'Organizational' }, affiliation: [{ name: 'Kaggle' }] },
        ],
        title: [{ title: 'Titanic: Machine Learning from Disaster', titleType: null }],
        publisher: { name: 'Kaggle' },
        publication_year: '2012',
        resource_type: { resourceType: 'Tabular Dataset', resourceTypeGeneral: 'Dataset' },
        date: [{ date: '2012-09-28', dateType: 'Issued' }],
        related_identifier: [],
        size: ['891 records (train)', '7 features'],
        format: ['CSV'],
        version: '1.0',
        rights: [{ rights: 'Public Domain', rightsURI: 'https://creativecommons.org/publicdomain/zero/1.0/' }],
        description: [
            { description: 'Passenger survival data from the RMS Titanic disaster for binary classification tasks. Widely used as an introductory ML competition dataset.', descriptionType: 'Abstract' },
        ],
        geo_location: [{ geoLocationPlace: 'North Atlantic Ocean', geoLocationPoint: { pointLatitude: 41.7325, pointLongitude: -49.9469 } }],
        is_private: false,
    },
    {
        id: 'ds-imagenet-sub',
        creator: [
            { creatorName: { name: 'Deng, Jia', nameType: 'Personal' }, givenName: 'Jia', familyName: 'Deng', affiliation: [{ name: 'Princeton University' }] },
            { creatorName: { name: 'Fei-Fei, Li', nameType: 'Personal' }, givenName: 'Li', familyName: 'Fei-Fei', affiliation: [{ name: 'Stanford Vision Lab' }] },
        ],
        title: [{ title: 'ImageNet Benchmark Subset (200 classes)', titleType: null }],
        publisher: { name: 'Stanford Vision Lab' },
        publication_year: '2009',
        resource_type: { resourceType: 'Image Dataset', resourceTypeGeneral: 'Dataset' },
        date: [{ date: '2009-06-20', dateType: 'Issued' }, { date: '2021-03-01', dateType: 'Updated' }],
        related_identifier: [{ relatedIdentifier: '10.1109/CVPR.2009.5206848', relatedIdentifierType: 'DOI', relationType: 'IsDescribedBy' }],
        size: ['100000 images', '200 classes'],
        format: ['JPEG', 'XML annotations'],
        version: '2.0',
        rights: [{ rights: 'Non-commercial research only', rightsURI: 'https://www.image-net.org/download' }],
        description: [
            { description: 'Curated subset of ImageNet with 100K images across 200 classes for benchmarking image classification models.', descriptionType: 'Abstract' },
        ],
        geo_location: [],
        is_private: true,
    },
    {
        id: 'ds-imdb',
        creator: [
            { creatorName: { name: 'Maas, Andrew L.', nameType: 'Personal' }, givenName: 'Andrew L.', familyName: 'Maas', affiliation: [{ name: 'Stanford AI Lab' }] },
        ],
        title: [{ title: 'Large Movie Review Dataset (IMDB)', titleType: null }],
        publisher: { name: 'Stanford AI Lab' },
        publication_year: '2011',
        resource_type: { resourceType: 'Text Corpus', resourceTypeGeneral: 'Dataset' },
        date: [{ date: '2011-06-01', dateType: 'Issued' }],
        related_identifier: [{ relatedIdentifier: '10.3115/v1/P11-1015', relatedIdentifierType: 'DOI', relationType: 'IsDescribedBy' }],
        size: ['50000 reviews', '25000 train / 25000 test'],
        format: ['Plain text'],
        version: '1.0',
        rights: [{ rights: 'Open for research', rightsURI: 'https://ai.stanford.edu/~amaas/data/sentiment/' }],
        description: [
            { description: 'Large movie review dataset for binary sentiment classification. 25,000 highly polar reviews for training and 25,000 for testing.', descriptionType: 'Abstract' },
        ],
        geo_location: [],
        is_private: false,
    },
    {
        id: 'ds-coco',
        creator: [
            { creatorName: { name: 'Lin, Tsung-Yi', nameType: 'Personal' }, givenName: 'Tsung-Yi', familyName: 'Lin', affiliation: [{ name: 'Microsoft Research' }] },
            { creatorName: { name: 'Microsoft COCO Team', nameType: 'Organizational' }, affiliation: [{ name: 'Microsoft' }] },
        ],
        title: [{ title: 'COCO: Common Objects in Context', titleType: null }],
        publisher: { name: 'Microsoft Research' },
        publication_year: '2014',
        resource_type: { resourceType: 'Image + Annotations', resourceTypeGeneral: 'Dataset' },
        date: [{ date: '2014-09-01', dateType: 'Issued' }, { date: '2017-11-01', dateType: 'Updated' }],
        related_identifier: [{ relatedIdentifier: '10.1007/978-3-319-10602-1_48', relatedIdentifierType: 'DOI', relationType: 'IsDescribedBy' }],
        size: ['330000 images', '80 object categories', '1.5M object instances'],
        format: ['JPEG', 'JSON annotations'],
        version: '2017',
        rights: [{ rights: 'CC BY 4.0', rightsURI: 'https://creativecommons.org/licenses/by/4.0/' }],
        description: [
            { description: 'Large-scale object detection, segmentation, and captioning dataset. Contains 330K images with 80 object categories and over 1.5 million annotated instances.', descriptionType: 'Abstract' },
            { description: 'Images collected from Flickr with annotations via Amazon Mechanical Turk crowdsourcing.', descriptionType: 'Methods' },
        ],
        geo_location: [],
        is_private: false,
    },
    {
        id: 'ds-census-2020',
        creator: [
            { creatorName: { name: 'U.S. Census Bureau', nameType: 'Organizational' }, affiliation: [{ name: 'U.S. Department of Commerce' }] },
        ],
        title: [{ title: 'American Community Survey – Income Data 2020', titleType: null }],
        publisher: { name: 'U.S. Census Bureau' },
        publication_year: '2021',
        resource_type: { resourceType: 'Tabular Dataset', resourceTypeGeneral: 'Dataset' },
        date: [{ date: '2021-09-01', dateType: 'Issued' }],
        related_identifier: [],
        size: ['32561 records', '5 features'],
        format: ['CSV'],
        version: '1.1',
        rights: [{ rights: 'Public Domain', rightsURI: 'https://creativecommons.org/publicdomain/zero/1.0/' }],
        description: [
            { description: 'Updated census income data with modern demographic features from the American Community Survey. Used for income classification tasks.', descriptionType: 'Abstract' },
        ],
        geo_location: [{ geoLocationPlace: 'United States' }],
        is_private: true,
    },
];

// ─── Mock Deployments ────────────────────────────────────────────────
const deployments = [
    { device_id: 'edge-rpi-01', device_type: 'Raspberry Pi 4', location: 'Lab A', timestamp: '2026-03-04T10:30:00', status: 'active', avg_inference_ms: 145 },
    { device_id: 'edge-jetson-01', device_type: 'Jetson Nano', location: 'Lab B', timestamp: '2026-03-03T14:00:00', status: 'active', avg_inference_ms: 42 },
    { device_id: 'cloud-aws-01', device_type: 'AWS EC2 g4dn', location: 'us-east-1', timestamp: '2026-03-01T08:00:00', status: 'completed', avg_inference_ms: 8 },
];

// ─── Mock Submissions (pending review) ───────────────────────────────
let submissionIdCounter = 4;
const submissions = [
    {
        id: 'sub-001', type: 'model_card', status: 'pending',
        submitted_by: 'Alice Chen', submitted_at: '2026-03-05T09:00:00',
        reviewed_by: null, reviewed_at: null, admin_notes: '',
        data: {
            name: 'GPT-2 Text Generator', version: '1.0', author: 'Alice Chen',
            short_description: 'Fine-tuned GPT-2 for creative writing generation',
            category: 'NLP', input_type: 'Text', framework: 'pytorch',
            keywords: 'gpt-2, text generation, nlp, transformers',
            is_private: false, test_accuracy: 0.0, license: 'MIT',
        },
    },
    {
        id: 'sub-002', type: 'datasheet', status: 'pending',
        submitted_by: 'Bob Martinez', submitted_at: '2026-03-04T15:30:00',
        reviewed_by: null, reviewed_at: null, admin_notes: '',
        data: {
            name: 'Fashion MNIST Extended', version: '2.0',
            description: 'Extended Fashion MNIST with 100K images across 20 categories.',
            source: 'Custom Collection', datapoints: 100000,
            license: 'CC BY 4.0', features: ['Grayscale Images (28x28)', 'Labels (20 categories)'],
        },
    },
    {
        id: 'sub-003', type: 'model_card', status: 'approved',
        submitted_by: 'Carol Davis', submitted_at: '2026-03-03T11:00:00',
        reviewed_by: 'System Admin', reviewed_at: '2026-03-03T14:00:00', admin_notes: 'Looks good.',
        data: {
            name: 'Logistic Regressor', version: '0.5', author: 'Carol Davis',
            short_description: 'Simple logistic regression baseline for income prediction',
            category: 'Classification', input_type: 'Tabular', framework: 'scikit-learn',
            keywords: 'baseline, logistic regression, classification',
            is_private: false, test_accuracy: 0.72, license: 'BSD-3 Clause',
        },
    },
];

// ─── Mock Tickets ────────────────────────────────────────────────────
let ticketIdCounter = 5;
const tickets = [
    {
        id: 'TKT-001', subject: 'Cannot download model weights', category: 'Bug Report',
        priority: 'High', status: 'open', description: 'When I click the download link for ResNet-152, I get a 403 error. Please check permissions.',
        submitted_by: 'Bob Martinez', submitted_at: '2026-03-05T08:30:00',
        admin_response: '', resolved_at: null,
    },
    {
        id: 'TKT-002', subject: 'Request access to private models', category: 'Access Request',
        priority: 'Medium', status: 'in_progress', description: 'I need access to the Foundational UCI Model for my research project. PI: Dr. Smith, Grant: NSF-12345.',
        submitted_by: 'David Kim', submitted_at: '2026-03-04T16:00:00',
        admin_response: 'Reviewing with PI.', resolved_at: null,
    },
    {
        id: 'TKT-003', subject: 'Incorrect accuracy metric displayed', category: 'Bug Report',
        priority: 'Low', status: 'resolved', description: 'The Titanic model shows 75.9% accuracy on the explore page but the paper reports 78.2%. Please verify.',
        submitted_by: 'Alice Chen', submitted_at: '2026-03-03T10:00:00',
        admin_response: 'The displayed value reflects the test set accuracy cached at upload time. The paper value is from a different split. No action needed.', resolved_at: '2026-03-03T15:00:00',
    },
    {
        id: 'TKT-004', subject: 'Add new category: Reinforcement Learning', category: 'Feature Request',
        priority: 'Medium', status: 'open', description: 'Could you add "Reinforcement Learning" as a model category? We have several RL models to submit.',
        submitted_by: 'Eva Rossi', submitted_at: '2026-03-02T12:00:00',
        admin_response: '', resolved_at: null,
    },
];

// ─── Routes ──────────────────────────────────────────────────────────

// Home
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Patra Knowledge Base (Mock Server)', version: '1.0' });
});

// List all model cards
app.get('/modelcards', (req, res) => {
    const summaries = modelCards.map(({ id, name, version, author, category, is_private, ai_model, short_description, keywords, input_type, foundational_model }) => ({
        id, name, version, author, category, is_private, short_description, keywords, input_type, foundational_model,
        framework: ai_model.framework,
        test_accuracy: ai_model.test_accuracy,
        model_type: ai_model.model_type,
    }));
    res.json(summaries);
});

// Search model cards
app.get('/modelcards/search', (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    if (!q) return res.status(400).json({ error: 'Query (q) is required' });
    const results = modelCards.filter(mc =>
        mc.name.toLowerCase().includes(q) ||
        mc.short_description.toLowerCase().includes(q) ||
        mc.keywords.toLowerCase().includes(q) ||
        mc.author.toLowerCase().includes(q)
    );
    res.json(results);
});

// Get single model card
app.get('/modelcard/:id', (req, res) => {
    const mc = modelCards.find(m => m.id === req.params.id);
    if (!mc) return res.status(404).json({ error: 'Model card could not be found!' });
    res.json(mc);
});

// Get deployments
app.get('/modelcard/:id/deployments', (req, res) => {
    const mc = modelCards.find(m => m.id === req.params.id);
    if (!mc) return res.status(404).json({ error: 'Model card could not be found!' });
    const count = Math.floor(Math.random() * 3) + 1;
    res.json(deployments.slice(0, count).map(d => ({ ...d, model_id: req.params.id })));
});

// Get download URL
app.get('/modelcard/:id/download_url', (req, res) => {
    const mc = modelCards.find(m => m.id === req.params.id);
    if (!mc) return res.status(404).json({ error: 'Model could not be found!' });
    res.json({ download_url: mc.ai_model.location });
});

// List all datasheets
app.get('/datasheets', (req, res) => {
    res.json(datasheets);
});

// Get single datasheet
app.get('/datasheet/:id', (req, res) => {
    const ds = datasheets.find(d => d.id === req.params.id);
    if (!ds) return res.status(404).json({ error: 'Datasheet not found' });
    res.json(ds);
});

// ─── Submission Routes ───────────────────────────────────────────────

// List all submissions (admin)
app.get('/submissions', (req, res) => {
    const status = req.query.status;
    let list = submissions;
    if (status) list = list.filter(s => s.status === status);
    res.json(list);
});

// Get single submission
app.get('/submissions/:id', (req, res) => {
    const sub = submissions.find(s => s.id === req.params.id);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    res.json(sub);
});

// Create submission (user)
app.post('/submissions', (req, res) => {
    const body = req.body;
    const newSub = {
        id: `sub-${String(submissionIdCounter++).padStart(3, '0')}`,
        type: body.type || 'model_card',
        status: 'pending',
        submitted_by: body.submitted_by || 'Anonymous',
        submitted_at: new Date().toISOString(),
        reviewed_by: null, reviewed_at: null, admin_notes: '',
        data: body.data || {},
    };
    submissions.unshift(newSub);
    res.status(201).json(newSub);
});

// Update submission status (admin approve/reject)
app.put('/submissions/:id', (req, res) => {
    const sub = submissions.find(s => s.id === req.params.id);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    if (req.body.status) sub.status = req.body.status;
    if (req.body.admin_notes !== undefined) sub.admin_notes = req.body.admin_notes;
    sub.reviewed_by = req.body.reviewed_by || 'System Admin';
    sub.reviewed_at = new Date().toISOString();
    res.json(sub);
});

// ─── Ticket Routes ───────────────────────────────────────────────────

// List all tickets
app.get('/tickets', (req, res) => {
    const status = req.query.status;
    let list = tickets;
    if (status) list = list.filter(t => t.status === status);
    res.json(list);
});

// Get single ticket
app.get('/tickets/:id', (req, res) => {
    const tkt = tickets.find(t => t.id === req.params.id);
    if (!tkt) return res.status(404).json({ error: 'Ticket not found' });
    res.json(tkt);
});

// Create ticket (user)
app.post('/tickets', (req, res) => {
    const body = req.body;
    const newTicket = {
        id: `TKT-${String(ticketIdCounter++).padStart(3, '0')}`,
        subject: body.subject || '',
        category: body.category || 'General',
        priority: body.priority || 'Medium',
        status: 'open',
        description: body.description || '',
        submitted_by: body.submitted_by || 'Anonymous',
        submitted_at: new Date().toISOString(),
        admin_response: '', resolved_at: null,
    };
    tickets.unshift(newTicket);
    res.status(201).json(newTicket);
});

// Update ticket (admin)
app.put('/tickets/:id', (req, res) => {
    const tkt = tickets.find(t => t.id === req.params.id);
    if (!tkt) return res.status(404).json({ error: 'Ticket not found' });
    if (req.body.status) tkt.status = req.body.status;
    if (req.body.admin_response !== undefined) tkt.admin_response = req.body.admin_response;
    if (tkt.status === 'resolved') tkt.resolved_at = new Date().toISOString();
    res.json(tkt);
});

// ─── Mock Users ──────────────────────────────────────────────────────
let userIdCounter = 7;
const users = [
    { id: 'usr-001', name: 'System Admin', email: 'admin@patra.io', password: 'admin123', role: 'admin', group: 'Platform Team', status: 'active', created_at: '2026-01-01T00:00:00' },
    { id: 'usr-002', name: 'Alice Chen', email: 'alice@lab.edu', password: 'alice123', role: 'user', group: 'ML Research', status: 'active', created_at: '2026-02-10T09:00:00' },
    { id: 'usr-003', name: 'Bob Martinez', email: 'bob@lab.edu', password: 'bob123', role: 'user', group: 'ML Research', status: 'active', created_at: '2026-02-15T10:00:00' },
    { id: 'usr-004', name: 'Carol Davis', email: 'carol@company.com', password: 'carol123', role: 'user', group: 'Data Science', status: 'active', created_at: '2026-02-20T11:00:00' },
    { id: 'usr-005', name: 'David Kim', email: 'david@university.edu', password: 'david123', role: 'user', group: 'Data Science', status: 'active', created_at: '2026-03-01T08:00:00' },
    { id: 'usr-006', name: 'Eva Rossi', email: 'eva@research.org', password: 'eva123', role: 'admin', group: 'Platform Team', status: 'active', created_at: '2026-03-02T12:00:00' },
];

const groups = ['Platform Team', 'ML Research', 'Data Science', 'DevOps', 'External'];

// ─── Auth Routes ─────────────────────────────────────────────────────

// Tapis JWT login — simulates: t = Tapis(base_url, username, password); t.get_tokens()
// The hardcoded admin bypass (admin/admin) is handled on the frontend
app.post('/auth/tapis', (req, res) => {
    const { username, password, base_url } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    // Simulate Tapis token generation — in production this calls Tapipy
    // For mock: accept any username/password and return a mock JWT
    const mockUser = {
        username,
        name: username.charAt(0).toUpperCase() + username.slice(1),
        email: `${username}@tapis.io`,
        role: 'user',
        auth_type: 'tapis',
        tapis_base_url: base_url || 'https://tacc.tapis.io',
    };
    const token = `tapis-jwt-${username}-${Date.now()}`;
    res.json({ user: mockUser, token });
});

// ─── User Management Routes (admin) ─────────────────────────────────

// List all users
app.get('/users', (req, res) => {
    res.json(users.map(({ password, ...u }) => u));
});

// Get groups
app.get('/groups', (req, res) => {
    res.json(groups);
});

// Create user (admin)
app.post('/users', (req, res) => {
    const { name, email, password, role, group } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
    if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already exists' });
    const newUser = {
        id: `usr-${String(userIdCounter++).padStart(3, '0')}`,
        name, email, password: password || 'changeme',
        role: role || 'user', group: group || '', status: 'active',
        created_at: new Date().toISOString(),
    };
    users.push(newUser);
    const { password: _, ...safe } = newUser;
    res.status(201).json(safe);
});

// Update user (admin — role, group, status)
app.put('/users/:id', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (req.body.role) user.role = req.body.role;
    if (req.body.group !== undefined) user.group = req.body.group;
    if (req.body.status) user.status = req.body.status;
    if (req.body.name) user.name = req.body.name;
    const { password: _, ...safe } = user;
    res.json(safe);
});

// Delete user (admin)
app.delete('/users/:id', (req, res) => {
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    users.splice(idx, 1);
    res.json({ success: true });
});

// ─── Start ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n  🧪  Patra Mock Server running at http://localhost:${PORT}`);
    console.log(`  📚  ${modelCards.length} model cards | ${datasheets.length} datasheets`);
    console.log(`  📝  ${submissions.length} submissions | ${tickets.length} tickets`);
    console.log(`  👤  ${users.length} users | ${groups.length} groups\n`);
});

