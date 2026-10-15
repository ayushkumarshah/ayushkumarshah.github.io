---
layout: archive
title: "Research"
permalink: /research/
author_profile: true
excerpt: "Welcome to my research page. I currently work on post-training of Meta's frontier large language models (Muse), spanning LLM research, speech, audio and music, and coding. Here you'll also find my earlier work on video AI at Meta, speech AI at Amazon, and my Ph.D. research on visual parsers for mathematical and chemical formulas. I’ve also included links to live demos, open-source code, and publications to make my research more accessible and engaging."
---

**Research Interests**:

Large language models (post-training and evaluation), speech, audio and music
AI, multimodal deep learning, code generation, computer vision, video
understanding and generation, pattern recognition, and recognition of
graphical structures.

## Current work: Frontier LLMs at Meta (Applied AI)
Since June 2026, I have been a Research Scientist in Meta's **Applied AI (AAI)**
org, working on the post-training of Meta's frontier large language models,
the **Muse** family. I contribute across three areas:

- **LLM research.** Post-training, data curation, and evaluation methods,
  including reinforcement learning and fine-tuning, that improve the models'
  reasoning, instruction-following, and multi-turn dialogue.
- **Speech, audio and music.** My current focus: advancing how the models
  understand and generate speech, audio, and music.
- **Coding.** Designing expert-level tasks, benchmarks, and training data that
  measure capability gaps and strengthen the models' software engineering
  abilities.

A common thread is rigorous measurement: building evaluations that expose
where capable models still fail, and using those results to improve them.

## Previous work at Meta: Video AI (Media Foundation Video team)
From July 2025 to May 2026, I designed transformer- and diffusion-based models
for video enhancement (super-resolution, restoration, denoising), compression,
quality optimization, and accessibility across Meta's Family of Apps
(Facebook, Instagram, WhatsApp, Messenger), and collaborated with the **Meta
Superintelligence Lab** on large vision models (LVMs) for video generation,
curation, and multimodal understanding.

## Speech AI at Amazon (Alexa Speaker Understanding)
As an Applied Scientist Intern (2022), I improved Alexa speaker identification
accuracy by 5% with semi-supervised learning while cutting training time by
80%, and built clustering-based annotation pipelines that labeled over 10
million hours of speech data.

## Ph.D. research (RIT, 2020 – 2025)
My doctoral research at the
[Document and Pattern Recognition Lab (DPRL)](https://www.cs.rit.edu/~dprl/),
advised by [Dr. Richard Zanibbi](https://www.cs.rit.edu/~rlaz/), developed
fast, interpretable visual parsers for math and chemical formulas. Using graph
attention-based task interaction, I enhanced contextual information while
keeping a natural and interpretable graph representation, recognizing complex
notation across born-digital PDFs, typeset images, and handwritten strokes.
Dissertation:
[*Parsing of Math Formulas and Chemical Diagrams using Graph-Based Representation and Attention Models*](https://repository.rit.edu/theses/12254/).

### Ph.D. projects
- [Multimodal Chemical Search](https://reactionminer-demo.platform.moleculemaker.org/reaction-miner),
    A system for searching chemical reactions, molecular structures, and text in
    scientific literature. It integrates text, SMILES, and reaction-based
    queries, linking extracted reaction details with molecular diagrams and
    textual descriptions. The interface provides structured reaction and
    molecule cards for easy navigation and retrieval, supporting chemists in
    literature exploration and data extraction. Code is open-source and
    available [here](https://gitlab.com/dprl/reactionminer_search).

- [ChemScraper](https://chemscraper.platform.moleculemaker.org/configuration),
    a fast and accurate molecule diagram parser using 
    characters and graphics extracted from born-digital (vector) PDF images—without
    the need for OCR, GPU, or vectorization. It uses these outputs to create
    training data for a new approach to visual parsing of molecule diagrams in
    raster images (i.e., pixel-based formats like PNGs) using a multi-task,
    segmentation-aware convolutional neural network (CNN). Code is open-source
    and available [here](https://gitlab.com/dprl/graphics-extraction/).
<!-- - --> 
<!--     a molecule diagram parser, which extracts characters and graphics --> 
<!--     from PDF molecule images using typesetting instructions, applies simple graph transformation algorithms -->
<!--     to convert them into visual and then chemical graphs — without OCR, GPU, or vectorization. --> 
<!--     ChemScraper's fast speed and reliable accuracy enables it -->
<!--     to contribute significantly in creating fine-grained annotated dataset for --> 
<!--     training visual parsers. -->
- [MathDeck project](https://demo.mathdeck.org/), a 
    system for searching PDF documents in a portion of the ACL Anthology, incorporating 
    both formulas and text, displaying matched words and formulas in context.
    Its user-friendly interface includes formula 'chips' for easy formula creation,
    search, reuse and annotation. MathDeck supports both LaTeX and visual formula editing.
- Built a new open-source [math formula extraction pipeline](https://gitlab.com/dprl/graphics-extraction)
    for PDF files
- Adopted distributed parallelization methods with multiple GPUs and implemented
    custom dataloader with dynamic batch size to fully utilize the GPU, which
    increased the speed of the math formula parser by 6 times
- Built [new tools](https://gitlab.com/dprl/lgeval) for visualization and evaluation of 
    parsing results and fine-grained errors analysis
- Worked on a PDF symbol extractor, called SymbolScraper that identifies precise bounding box locations in born-digital PDF documents
- Wrote an API for recognizing handwritten and typeset formulas and output the corresponding LATEX and MathML
