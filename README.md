# Github Actions pro validaci Lokálního katalogu otevřených dat (LKOD) na GitHubu
Tento repozitář obsahuje sadu Github Actions, jenž je možné použít pro validaci LKODu na GitHubu.

## Použití
Následující příklad popisuje workflow, jenž využívá akce z tohoto repozitáře k validaci:
 * *.json a *.jsonld soubory jsou syntakticky validní
 * *.jsonld obrahují alespoň jednu trojici 

```
name: CI

on:
  push:
  pull_request:
    branches: [ master ]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v2
    - name: Get all files
      uses: opendata-mvcr/lkod-github-actions/list-files@master
    - name: Filter files
      uses: opendata-mvcr/lkod-github-actions/filter-files@master
      with:
        input-file: ./files.json
        filter-json: >-
          {
            "./files-json.json": [ ".*\\.json" ],
            "./files-jsonld.json": [ ".*\\.jsonld" ]
          }
    - run: touch ${HOME}/report.json
    - name: Validate JSON syntax
      uses: opendata-mvcr/lkod-github-actions/validate-json-syntax@master
      with:
        input-file: ./files-json.json
        output-file: ./report.json
    - name: Validate JSON-LD not empty
      uses: opendata-mvcr/lkod-github-actions/validate-jsonld-not-empty@master
      with:
        input-file: ./files-jsonld.json
        output-file: ./report.json
    - name: Push annotations
      uses: opendata-mvcr/lkod-github-actions/push-annotations@master
      with:
        annotations-file: ./report.json
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Tento repozitář je udržován v rámci projektu OPZ č. CZ.03.4.74/0.0/0.0/15_025/0013983.
![Evropská unie - Evropský sociální fond - Operační program Zaměstnanost](https://data.gov.cz/images/ozp_logo_cz.jpg)

