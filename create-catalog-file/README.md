# Create Catalog File
This action requires a collection of datasets file as specified in 
[Formal Open-Specification](https://ofn.gov.cz/rozhran%C3%AD-katalog%C5%AF-otev%C5%99en%C3%BDch-dat/2021-01-11/) 
(FOS) and a catalog file template specified by the same FOS.

This plugin recursively search given directory for ```jsonld``` files, with
datasets according to FOS. It then load the catalog file template and append
the IRIs of the datasets.

Example workflow:
```
name: CreateLocalCatalog

on:
  push:
  pull_request:
    branches:
    - master
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v2
      with:
        persist-credentials: false
        fetch-depth: 0
    - name: Create catalog file
      uses: skodapetr/lkod-mvcr/create-catalog-file@master
      with: 
       datasets-root: ${{ github.workspace }}
       catalog-template-file: ${{ github.workspace }}/catalog-template.jsonld
       filter-output-file: ${{ github.workspace }}/catalog.jsonld
    - name: Commit & Push changes
      uses: actions-js/push@master
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        message: "Update LKOD definition"

```