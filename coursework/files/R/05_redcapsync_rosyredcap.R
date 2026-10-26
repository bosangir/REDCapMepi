# TBCARE · 05 · Standardised pipelines with REDCapSync and exploratory analysis with RosyREDCap
# REDCapSync keeps a local copy of the project and, using the REDCap log, re-downloads only changed records.
# install.packages("REDCapSync")
library(REDCapSync)

# Token in ~/.Renviron, named after the project:
#   REDCAPSYNC_TBCARE=paste_your_token_here
project <- setup_project(
  project_name   = "TBCARE",
  redcap_uri     = "https://redcap.uantwerpen.be/api/",
  dir_path       = getwd(),
  sync_frequency = "daily",
  get_entire_log = TRUE
)
project$test_token()
project$sync()                                     # first time: everything; later: only changes
project$generate_dataset("custom", envir = globalenv())

# RosyREDCap: point-and-click Shiny app on top of REDCapSync projects (not on CRAN)
# remotes::install_github("thecodingdocs/RosyREDCap")
library(RosyREDCap)
run_RosyREDCap()
# Note: the RosyREDCap documentation says it is not yet suited to multi-arm or very large projects.
# TBCARE has 2 arms: use it for a quick look, and REDCapR/REDCapDM for the real pipeline.
