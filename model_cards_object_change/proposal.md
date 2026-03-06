Year 5 Patra Model Cards (delivery Aug 2026) 

 

Year 5 Workplan with Aug 2026 delivery (only this paragraph is shared with ICICLE): The Patra project team commits to building and maintaining a Model Card or Data Sheet for every AI/ML model and dataset brought into the ICICLE environment for use. This includes models pulled into ICICLE directly from HuggingFace or GitHub (and indexed through MLHub) – that is, models not created with aid of Patra Toolkit. The Patra project team shares the principal value of high-quality metadata so will strive to augment imported metadata records that are anticipated to have low quality metadata. It will add support for tracking the lifecycle of models including their influence, derivation from other models.  

Year 5 Workplan Sep-Oct 2026 – continue to serve needs of users of the ICICLE ecosystem.  

Success Criteria  

User feedback-driven changes 

Patra has a Model Card or Data Sheet for every AI/ML model and dataset brought into the ICICLE environment for use. 

Project Members 

Beth Plale (UO, PI) 

Neelesh Karthikeyan (UO) 

William Qiu (UO) 

 

-----above suitable for sharing with ICICLE team. Below is internal project details only ------ 

 

Getting started: Neelesh will organize work in table into a timeline of sprints to take place over the next 6 months. This sprint schedule will be discussed Sun Feb 22 

 

Implementation Tasks: 

Task Objective 

Task Description 

 Problem Details 

Datasheet as 1st class node 

 Isolate Datasheet as its own graph node.  Create CRUD APIs.  

Includes expose FastAPI endpoints to MLHub 

Ingest model cards from Hugging Face and GitHub 

Ingest all from HuggingFace/ICICLE. Uses metadata available from those sources.  Augment metadata from sources to improve quality. Create these by hand for the 6 objects in huggingface/icicle. We learn from that then work on automating the process. 

 

Create these by hand for the 6 objects. Follow-on could be through something like a Watcher: an asynchronous event-driven listener utilizing webhooks ensuring real-time sync with Hugging Face Hub. 

Augmented metadata could have a Confidence Score and source-text citations to each augmented field to facilitate human-in-the-loop verification. Explore the feasibility of integrating Patra-RGCN work to predict missing links. 

 

Extend to include user-specified attributes 

 Both Model Card and Dataset schemas will be extensible to allow for user added metadata fields (such as key/value pairs; these will not be verified or queriable) 

  

Define edge vocabulary 

 Create controlled vocab for edges. Every edge in Patra KG will be labeled, and the label drawn from this controlled vocabulary.  

  

Register all DS & MCs activity in ICICLE in Patra 

 Work with other ICICLE projects (dig ag especially) to track down models (and data) used in the ICICLE ecosystem and get cards and datasheets created and registered into Patra. This will likely be a manual process to start.  This manual process will also be needed to create model cards and datasheets for artifacts in HuggingFace/ICICLE repository 

  

Represent versions 

  Hugging face uses hashes for unique IDs (see below) 

  

 Extend metadata with deployment data 

  First study MLHub/Hugging Face attributes that are intended for use in deploying a model and not amongst Patra metadata.  Extend the Patra model card graph node and Datasheet graph node as needed to more fully support this task.  

  

Privacy Layer:  

 

JWT-based authentication and Role-Based Access Control (RBAC) to ensure users only access model cards they created or are authorized to view, hosted securely within Kubernetes pods. 

 

This is not on the immediate agenda 

  

  

version https://git-lfs.github.com/spec/v1 

oid sha256:828a8a98d6da3fadabf29b973d8da241d954996837a263e55baa541c421a6e52 

size 5360347216 

 

1. Model Card Object 

This object acts as the governance hub.  

{ 
 "id": "string", 
 "name": "string", 
 "version": "string", 
 "short_description": "string", 
 "full_description": "string", 
 "keywords": "string", 
 "author": "string", 
 "citation": "string", 
 "input_data": "string", 
 "input_type": "string", 
 "output_data": "string", 
 "foundational_model": "string", 
 "category": "string", 
 "documentation": "string", 
 "links": { 
   "model_id": "string", 
   "datasheet_id": "string", 
   "requirements_id": "string", 
   "explainability_analysis_id": "string", 
   "bias_analysis_id": "string" 
 } 
} 

1.1 Model Card Updates 

1.1.1 from AWS (governance-oriented)	 

{  

"risk_rating": "string", 

"explanations_for_risk_rating": "string", 

"training_job_details": "string", 

"evaluation_details.metric_groups": "string", 

"custom_details": "string" 
 
} 

1.1.2 from Hugging Face (transparency & reproducibility-oriented) 

{  

"Direct Use / Downstream Use / Out-of-Scope Use": "string", 

"explanations_for_risk_rating": "string", 

"Bias, Risks, Limitations": "string", 

"Training Data + Training Procedure + Hyperparameters": "string", 

"Technical Specifications": "string", 

"Environmental Impact": "string", 
 
} 

	 

 

2. Dataset Object (TBD) 

{ 
 "id": "string", 
 "name": "string", 
 "version": "string", 
 "description": "string", 
 "doi": "string", 
 "download_url": "string", 
 "external_id": "string", 
 "source": "string", 
 "license": "string", 
 "associated_tasks": "string", 
 "target_variable": "string", 
 "attribute_types": "string", 
 "categories": "string", 
 "keywords": ["string"], 
} 
 

3. Model Requirements Object 

{ 
 "id": "string", 
 "framework": "string", 
 "python_version": "string", 
 "dependencies": [ 
   { 
     "package": "string", 
     "version": "string" 
   } 
 ], 
 "hardware_constraints": { 
   "gpu_required": "boolean", 
   "min_memory": "string" 
 } 
} 
 

4. Experiment Object (MLField Planner) 

{ 
 "experiment_id": "string", 
 "user_id": "string", 
 "device_id": "string", 
 "model_id": "string", 
 "start_time": "string", 
 "end_time": "string", 
 "submitted_time": "string", 
 "average_accuracy": "number", 
 "deployment_data": { 
   "deployment_id": "string", 
   "start_time": "string", 
   "end_time": "string", 
   "total_cpu_power_consumption": "number", 
   "total_gpu_power_consumption": "number", 
   "image_generating_plugin_cpu_power_consumption": "number", 
   "image_generating_plugin_gpu_power_consumption": "number", 
   "image_scoring_plugin_cpu_power_consumption": "number", 
   "image_scoring_plugin_gpu_power_consumption": "number", 
   "power_monitor_plugin_cpu_power_consumption": "number", 
   "power_monitor_plugin_gpu_power_consumption": "number" 
 }, 
 "results_summary": { 
   "image_count": "integer", 
   "image_decision": "string", 
   "ground_truth": "string", 
   "average_inference_latency": "number" 
 } 
} 
 