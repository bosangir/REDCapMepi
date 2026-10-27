# =============================================================================
# TBCARE · 05 · Standardised pipelines with REDCapSync, exploratory analysis with RosyREDCap
# REDCapSync keeps a local copy of the project. On each sync it reads the REDCap log
# (the audit trail) and re-downloads only the records that changed since the last time.
# =============================================================================
# install.packages("REDCapSync")    # run once
library(REDCapSync)

# REDCapSync looks for the token in an environment variable named after the project.
# Put this line in ~/.Renviron and restart R:
#   REDCAPSYNC_TBCARE=paste_your_token_here

# setup_project() describes the project once:
#   project_name    a short name; also used to find the token (REDCAPSYNC_TBCARE)
#   redcap_uri      the API address of the server
#   dir_path        the folder where the local copy is kept
#   sync_frequency  how often a sync is allowed to download again
#   get_entire_log  download the full audit trail the first time
project <- setup_project(
  project_name   = "TBCARE",
  redcap_uri     = "https://redcap.uantwerpen.be/api/",
  dir_path       = getwd(),
  sync_frequency = "daily",
  get_entire_log = TRUE
)
project$test_token()       # checks that the token works before downloading anything
project$sync()             # first time: everything; later: only what changed
# Build a dataset from the local copy and put it in the global environment (your workspace)
project$generate_dataset("custom", envir = globalenv())

# RosyREDCap: a point-and-click Shiny app on top of REDCapSync projects (not on CRAN yet)
# remotes::install_github("thecodingdocs/RosyREDCap")
library(RosyREDCap)
run_RosyREDCap()           # opens the app in your browser
# Note: the RosyREDCap documentation says it is not yet suited to multi-arm or very large
# projects. TBCARE has 2 arms: use it for a quick look, and REDCapR/REDCapDM for the pipeline.
