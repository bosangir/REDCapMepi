# REDCap: pre-class reading

Pre-class reading on REDCap (Research Electronic Data Capture) for the Research Data Management
course in the Master of Epidemiology (MEPI), University of Antwerp, 2026–27.

**Authors:** Bernard Isekah Osangir, Tafadzwa Maseko and Prof. Dr. Steven Abrams

**Read it online:** https://bosangir.github.io/REDCapMepi/

Companion page: [Data Management Plans](https://bosangir.github.io/DMP/)

## Contents

- What REDCap is, and why an EDC system is safer than a spreadsheet
- Building blocks: records, instruments, fields, events, arms and Data Access Groups
- The project lifecycle: Development, Production, Analysis/Cleanup, Completed
- The data dictionary, field types, validation and identifier flags
- Branching logic, calculated fields and action tags
- Surveys, e-consent, longitudinal studies and repeating instruments
- User rights, data quality tools, de-identified export and the API
- How REDCap fits into your Data Management Plan
- REDCap at UAntwerp (redcap.uantwerpen.be): log in with your student number (s02xxxxx) and UAntwerp password
- Recommended REDCap training videos (projectredcap.org/resources/videos)
- Checklist, random practice quiz, glossary and sources

## Course work page

**Online:** https://bosangir.github.io/REDCapMepi/coursework/

- Slide viewer for the REDCap training deck (64 slides), with PDF and PowerPoint downloads
- TBCARE case report forms in an interactive browser (by visit, with plain-language skip rules, piping and field embedding marked, and an annotated "build details" view), plus the paper and annotated PDFs
- TBCARE REDCap project XML (`coursework/files/TBCARE_2026_REDCap_project.xml`): the whole project in one upload, with 2 arms, 15 events, repeating settings, 2 Data Access Groups and 2 surveys
- TBCARE data dictionary, arms, events and form-event mapping (CSV, ready to upload)
- Simulated data for the Data Import Tool (clean, and with seven planted errors) and a national TB register extract for record linkage
- R in the browser (webR) on the simulated data, plus R scripts for REDCapR, REDCapDM, REDCapSync and RosyREDCap

Files live in `coursework/` (`index.html`, `app.js`, `slides/`, `docs/`, `files/`). TBCARE is fictional; all data are simulated.

## Homework page

**Online:** https://bosangir.github.io/REDCapMepi/homework/

- REDCap Part 2 slides (advanced features, 28 slides) in a slide viewer, with PDF and PowerPoint
- Class demo: create TBCARE from the XML file before the class
- Homework 2026-27: build TUMAINI, a fictional multi-centre study (it replaces PISTIC), with three arms, three Data Access Groups and a survey. Deadline: Sunday 13 December 2026, 11:00 (Brussels time)
- TUMAINI protocol summary and CRFs, the instructions, a submission checklist, and a quick reference on field embedding, piping, action tags, smart variables and special functions

Files live in `homework/`. The CRF browser used on the course-work page is in `shared/` (`crf.js`, `crf.css`).

## Editing

The pre-course page is one file, `index.html`; the course-work page is in `coursework/`. Edit it and push to `main`; GitHub Actions republishes it automatically.
