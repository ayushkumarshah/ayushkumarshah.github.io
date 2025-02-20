---
title: "ChemScraper: Leveraging PDF Graphics Instructions for Molecular Diagram Parsing"
collection: publications
permalink: /publications/2023-11-18-chemscraper
excerpt: 'ChemScraper is a molecular diagram parser that directly extracts characters and graphical elements from PDFs without using OCR or GPUs. The extracted data is used for training neural models for molecular recognition in raster images.'
date: 2024-09-01
venue: 'International Journal on Document Analysis and Recognition (IJDAR)'
paperurl: 'https://link.springer.com/article/10.1007/s10032-024-00486-7'
poster: '/files/ICDAR2024.pdf'
pdf: '/files/ChemScraper-IJDAR-2024.pdf'
citation: 'A. K. Shah, B. M. Amador, A. Dey, M. Creekmore, B. Ocampo, S. Denmark, and R. Zanibbi, “ChemScraper: Leveraging PDF Graphics Instructions for Molecular Diagram Parsing,” in Document Analysis and Recognition (Journal) - IJDAR 2024, vol. 27, Sep. 2024, pp. 395-414, doi: 10.1007/s10032-024-00486-7.'
code: 'https://gitlab.com/dprl/graphics-extraction/-/tree/icdar2024'
demo: 'https://chemscraper.platform.moleculemaker.org/configuration'
bibtex: |
  @article{shahChemScraper2024,
      author = {Shah, Ayush Kumar and Amador, Bryan and Dey, Abhisek and Creekmore, Ming and Ocampo, Blake and Denmark, Scott and Zanibbi, Richard},
      date = {2024/09/01},
      date-added = {2024-09-16 13:05:39 -0400},
      date-modified = {2024-09-16 13:05:39 -0400},
      doi = {10.1007/s10032-024-00486-7},
      id = {Shah2024},
      isbn = {1433-2825},
      journal = {International Journal on Document Analysis and Recognition (IJDAR)},
      number = {3},
      pages = {395--414},
      title = {ChemScraper: leveraging PDF graphics instructions for molecular diagram parsing},
      url = {https://doi.org/10.1007/s10032-024-00486-7},
      volume = {27},
      year = {2024},
      bdsk-url-1 = {https://doi.org/10.1007/s10032-024-00486-7}
  }
---

## Abstract:
Most molecular diagram parsers recover chemical structure from raster images
(e.g., PNGs). However, many PDFs include commands giving explicit locations and
shapes for characters, lines, and polygons. We present a new parser that uses
these born-digital PDF primitives as input. The parsing model is fast and
accurate, and does not require GPUs, Optical Character Recognition (OCR), or
vectorization. We use the parser to annotate raster images and then train a new
multi-task neural network for recognizing molecules in raster images. We
evaluate our parsers using SMILES and standard benchmarks, along with a novel
evaluation protocol comparing molecular graphs directly that supports automatic
error compilation and reveals errors missed by SMILES-based evaluation. On the
synthetic USPTO benchmark, our born-digital parser obtains a recognition rate of
98.4% (1% higher than previous models) and our relatively simple neural parser
for raster images obtains a rate of 85% using less training data than existing
neural approaches (thousands vs. millions of molecules).

<iframe src="/files/ICDAR2024.pdf" width="100%" height="600" frameborder="no" border="0" marginwidth="0" marginheight="0"></iframe>

<br>

<iframe src="/files/ChemScraper-IJDAR-2024.pdf" width="100%" height="800" frameborder="no" border="0" marginwidth="0" marginheight="0"></iframe>


<!--<br>-->
<!--**.bib:**-->
<!---->
<!--```bib-->
<!--@article{shahChemScraper2024,-->
<!--	abstract = {Most molecular diagram parsers recover chemical structure from raster images (e.g., PNGs). However, many PDFs include commands giving explicit locations and shapes for characters, lines, and polygons. We present a new parser that uses these born-digital PDF primitives as input. The parsing model is fast and accurate, and does not require GPUs, Optical Character Recognition (OCR), or vectorization. We use the parser to annotate raster images and then train a new multi-task neural network for recognizing molecules in raster images. We evaluate our parsers using SMILES and standard benchmarks, along with a novel evaluation protocol comparing molecular graphs directly that supports automatic error compilation and reveals errors missed by SMILES-based evaluation. On the synthetic USPTO benchmark, our born-digital parser obtains a recognition rate of 98.4{\%} (1{\%} higher than previous models) and our relatively simple neural parser for raster images obtains a rate of 85{\%} using less training data than existing neural approaches (thousands vs. millions of molecules).},-->
<!--	author = {Shah, Ayush Kumar and Amador, Bryan and Dey, Abhisek and Creekmore, Ming and Ocampo, Blake and Denmark, Scott and Zanibbi, Richard},-->
<!--	date = {2024/09/01},-->
<!--	date-added = {2024-09-16 13:05:39 -0400},-->
<!--	date-modified = {2024-09-16 13:05:39 -0400},-->
<!--	doi = {10.1007/s10032-024-00486-7},-->
<!--	id = {Shah2024},-->
<!--	isbn = {1433-2825},-->
<!--	journal = {International Journal on Document Analysis and Recognition (IJDAR)},-->
<!--	number = {3},-->
<!--	pages = {395--414},-->
<!--	title = {ChemScraper: leveraging PDF graphics instructions for molecular diagram parsing},-->
<!--	url = {https://doi.org/10.1007/s10032-024-00486-7},-->
<!--	volume = {27},-->
<!--	year = {2024},-->
<!--	bdsk-url-1 = {https://doi.org/10.1007/s10032-024-00486-7}}-->
<!--```-->

<!-- {% include iframe_holder.html url="/files/P1.17-teaser.mov" width="560" height="325" %} -->
