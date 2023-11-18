---
title: "A Math Formula Extraction and Evaluation Framework for PDF Documents"
collection: publications
permalink: /publication/2021-09-01-mathseer-pipeline
excerpt: 'This paper is about the number 1. The number 2 is left for future work.'
date: 2021-09-01
venue: 'International Conference on Document Analysis and Recognition (ICDAR)'
paperurl: 'https://doi.org/10.1007/978-3-030-86331-9_2'
pdf: '/files/Shah2021_MathSeer.pdf'
citation: 'A. K. Shah, A. Dey, and R. Zanibbi, “A Math Formula Extraction and Evaluation Framework for PDF Documents,” in Document Analysis and Recognition – ICDAR 2021, Cham, 2021, pp. 19–34. doi: 10.1007/978-3-030-86331-9_2.'
poster: '/files/237-presentation.pdf'
video: '/files/237-teaser.mp4'
code: 'https://gitlab.com/dprl/MathSeer-extraction-pipeline'
published: 'True'
---

## Abstract:

We present a processing pipeline for math formula extraction in PDF documents that takes advantage of character information
in born-digital PDFs (e.g., created using LATEX or Word). Our pipeline
is designed for indexing math in technical document collections to support math-aware search engines capable of processing queries containing
keywords and formulas. The system includes user-friendly tools for visualizing recognition results in HTML pages. Our pipeline is comprised
of a new state-of-the-art PDF character extractor that identifies precise
bounding boxes for non-Latin symbols, a novel Single Shot Detectorbased formula detector, and an existing graph-based formula parser (QDGGA) for recognizing formula structure. To simplify analyzing structure recognition errors, we have extended the LgEval library (from the
CROHME competitions) to allow viewing all instances of specific errors
by clicking on HTML links. Our source code is publicly available.

<iframe src="/files/237-presentation.pdf" width="100%" height="600" frameborder="no" border="0" marginwidth="0" marginheight="0"></iframe>

<br>

<iframe src="/files/Shah2021_MathSeer.pdf" width="100%" height="800" frameborder="no" border="0" marginwidth="0" marginheight="0"></iframe>


<br>
**.bib:**

@InProceedings{10.1007/978-3-030-86331-9_2,\\
author="**Shah, Ayush Kumar** and Dey, Abhisek and Zanibbi, Richard",\\
editor="Llad{\'o}s, Josep and Lopresti, Daniel and Uchida, Seiichi",\\
title="A Math Formula Extraction and Evaluation Framework for PDF Documents",\\
booktitle="Document Analysis and Recognition -- ICDAR 2021",                 \\
year="2021",                                                                 \\
publisher="Springer International Publishing",                               \\
address="Cham",                                                              \\
pages="19--34",                                                              \\
isbn="978-3-030-86331-9"                                                     \\
}

{% include iframe_holder.html url="/files/237-teaser.mp4" width="560" height="325" %}
