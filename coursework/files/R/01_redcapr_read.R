# =============================================================================
# TBCARE · 01 · Read data from REDCap with REDCapR
# MEPI Research Data Management, University of Antwerp. Fictional study, simulated data.
# =============================================================================
#
# BEFORE YOU START
# 1. In REDCap, give yourself API rights for your practice project
#    (User Rights > your name > API Export and API Import), then open the API page
#    and generate a token. A token is a long password that belongs to you AND this project.
# 2. Store the token outside your script, in the file ~/.Renviron:
#       REDCAP_TBCARE_TOKEN=paste_your_32_character_token_here
#    (In RStudio, usethis::edit_r_environ() opens that file.) Restart R afterwards.
# 3. Never put the token in a script, on GitHub, in an e-mail or in an AI chat.

# install.packages("REDCapR")     # run once per computer
library(REDCapR)                   # load the package in every new R session

# The address of the API on our REDCap server (check it on your project's API page)
uri   <- "https://redcap.uantwerpen.be/api/"
# Sys.getenv() reads a value from ~/.Renviron, so the token never appears in the script
token <- Sys.getenv("REDCAP_TBCARE_TOKEN")

# -----------------------------------------------------------------------------
# 1. What is in the project? (metadata)
# Every REDCapR function returns a list; $data holds the result as a data frame.
# -----------------------------------------------------------------------------
redcap_project_info_read(uri, token)$data           # title, longitudinal yes/no, repeating yes/no ...
arms    <- redcap_arm_export(uri, token)$data        # the 2 arms
events  <- redcap_event_read(uri, token)$data        # the 15 events, with day offsets
mapping <- redcap_event_instruments(uri, token)$data # which form is collected at which event
meta    <- redcap_metadata_read(uri, token)$data     # the data dictionary (one row per field)
redcap_instrument_repeating(uri, token)$data         # which forms and events repeat

# -----------------------------------------------------------------------------
# 2. Read all records in one request
# -----------------------------------------------------------------------------
ds <- redcap_read_oneshot(uri, token)$data
dim(ds)                          # number of rows and columns
table(ds$redcap_event_name)      # rows per event: one row per participant per visit

# -----------------------------------------------------------------------------
# 3. Read only what you need
# redcap_read() downloads in batches (safer for big projects) and lets you choose
# fields, forms and events. raw_or_label = "label" returns "Male" instead of 1.
# -----------------------------------------------------------------------------
clin <- redcap_read(
  redcap_uri   = uri, token = token,
  fields       = c("record_id"),                     # always include the record ID
  forms        = c("clinical_assessment"),           # all fields of this form
  events       = c("baseline_arm_1", "month_2_arm_1", "month_6_arm_1"),
  raw_or_label = "label"
)$data
head(clin)                       # first 6 rows

# -----------------------------------------------------------------------------
# 4. A repeating instrument: adverse events, one row per event
# subset() keeps the rows that meet the condition and, with select =, only these columns.
# -----------------------------------------------------------------------------
ae <- subset(ds, redcap_repeat_instrument == "adverse_events",
             select = c(record_id, redcap_repeat_instance, ae_term, ae_grade, ae_serious))
table(ae$ae_grade)               # number of adverse events per severity grade (codes 1-5)
