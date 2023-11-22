---
title: "ChemScraper: Graphics Extraction, Molecular Diagram Parsing,
        and Annotated Data Generation for PDF Images"
collection: publications
permalink: /publication/2023-11-18-chemscraper
excerpt: 'This paper is about the number 1. The number 2 is left for future work.'
date: 2024-09-01
venue: 'International Journal on Document Analysis and Recognition (IJDAR)'
paperurl: 'https://arxiv.org/abs/2311.12161'
pdf: '/files/ChemScraper-IJDAR-2024.pdf'
citation: 'A. K. Shah, B. M. Amador, A. Dey, M. Creekmore, B. Ocampo, S. Denmark, and R. Zanibbi, "ChemScraper: Graphics Extraction, Molecular Diagram Parsing, and Annotated Data Generation for PDF Images," in Document Analysis and Recognition (Journal) - IJDAR vol. 27, May. 2024, submitted.'
code: 'https://gitlab.com/dprl/graphics-extraction/-/tree/icdar2024'
---

## Abstract:
Existing visual parsers for molecule diagrams translate pixel-based raster images such as  PNGs to chemical structure representations (e.g., SMILES). However, PDFs created by word processors including LaTeX and Word provide explicit locations and shapes for characters, lines, and polygons. We 
extract symbols from born-digital PDF molecule images and then apply simple graph transformations to capture both visual and chemical structure in editable ChemDraw files (CDXML). Our fast ( PDF $\rightarrow$ visual graph $\rightarrow$ chemical graph ) pipeline does not require GPUs, Optical Character Recognition (OCR) or vectorization.
We evaluate on standard benchmarks using SMILES strings, along with a novel evaluation that provides graph-based metrics and error compilation using LgEval. 
The geometric information in born-digital PDFs produces a highly accurate parser, motivating generating training data for visual parsers that recognize from raster images, with extracted graphics, visual structure, and chemical structure as annotations. To do this we render SMILES strings in Indigo, parse molecule structure, and then validate recognized structure to select correct files.


<!-- <iframe src="/files/ICDAR2023.pdf" width="100%" height="600" frameborder="no" border="0" marginwidth="0" marginheight="0"></iframe> -->

<!-- <br> -->

<iframe src="/files/ChemScraper-IJDAR-2024.pdf" width="100%" height="800" frameborder="no" border="0" marginwidth="0" marginheight="0"></iframe>


<br>
**.bib:**

```bib
@misc{shahChemScraperGraphicsExtraction2023,
  title = {ChemScraper: Graphics Extraction, Molecular Diagram Parsing, and Annotated Data Generation for PDF Images},
  shorttitle = {ChemScraper},
  author = {Shah, Ayush Kumar and Amador, Bryan Manrique and Dey, Abhisek and Creekmore, Ming and Ocampo, Blake and Denmark, Scott and Zanibbi, Richard},
  year = {2023},
  month = nov,
  number = {arXiv:2311.12161},
  eprint = {2311.12161},
  primaryclass = {cs},
  publisher = {arXiv},
  doi = {10.48550/arXiv.2311.12161},
  urldate = {2023-11-22},
  archiveprefix = {arxiv},
  keywords = {Computer Science - Computer Vision and Pattern Recognition},
}
```

<!-- {% include iframe_holder.html url="/files/P1.17-teaser.mov" width="560" height="325" %} -->
