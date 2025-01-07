---
layout: archive
title: "Research"
permalink: /research/
author_profile: true
header:
  og_image: "/files/237-image.png"
---

**Research Interests**: 

Pattern recognition, recognition of graphical structures,
computer vision, speaker understanding, large language models, multi-modal deep
learning, natural language processing.

## Current work:
My current focus revolves around developing a fast, interpretable visual parser
for math and chemical formulas. Exploring innovative graph attention-based task
interaction techniques, I aim to enhance contextual information while
maintaining a natural and interpretable graph representation to recognize
graphical notations, including complex math and chemical formulas, across
various mediums like born-digital PDFs, typeset images, and handwritten strokes.

<!--My work centers around designing fast, efficient, and interpretable parsers-->
<!--for recognizing mathematical formulas and chemical diagrams-->
<!--across multiple formats, including PDFs, typeset images, and-->
<!--handwritten strokes. Through graph attention-based techniques and the-->
<!--integration of Large Language Models (LLMs), I aim to enhance how contextual-->
<!--information is processed while preserving a natural and interpretable graph-->
<!--representation.-->

## Past/ongoing research works:
- [ChemScraper](https://gitlab.com/dprl/graphics-extraction/-/tree/icdar2024),
    a fast and accurate molecule diagram parser using 
    characters and graphics extracted from born-digital (vector) PDF images—without
    the need for OCR, GPU, or vectorization. It uses these outputs to create
    training data for a new approach to visual parsing of molecule diagrams in
    raster images (i.e., pixel-based formats like PNGs) using a multi-task,
    segmentation-aware convolutional neural network (CNN).
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
