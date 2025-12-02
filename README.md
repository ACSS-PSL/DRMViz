[![python](https://img.shields.io/badge/python-3.12-blue.svg?style=flat&logo=python&logoColor=white)](https://www.python.org) [![ESLint](https://github.com/ACSS-PSL/DRMViz/actions/workflows/eslint.yml/badge.svg)](https://github.com/ACSS-PSL/DRMViz/actions/workflows/eslint.yml)

# DRMViz

Network of Ph. D. students, advisors and jury members from the Dauphine Recherche en Management research lab. Visualization produced for the DRM 50 years anniversary.

The project is composed of 2 main folders:

## `data_generation`

A Python project producing the data graph from the list of PhDs in DRM and with enrichments from the [Theses.fr open data](https://www.data.gouv.fr/datasets/theses-soutenues-en-france-depuis-1985/).

Install steps are available in the folder's [README](data_generation/README.md).

## `visualization`

A React web application displaying the interactions between memebrs of DRM lab and members of PhD juries. The visualization also provides filters and search features to focus on specific parts of the existence of the graph.

Install steps are available in the folder's [README](visualization/README.md).