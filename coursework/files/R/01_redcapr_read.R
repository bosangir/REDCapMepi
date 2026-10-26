# TBCARE · 01 · Read data from REDCap with REDCapR
# MEPI Research Data Management, University of Antwerp. Fictional study, simulated data.
#
# Before you start: in REDCap, request API rights for your practice project
# (User Rights > API Export/Import), then copy your token into ~/.Renviron:
#   REDCAP_TBCARE_TOKEN=paste_your_32_character_token_here
# Restart R. Never put the token in a script, on GitHub, in an e-mail or in an AI chat.

# install.packages("REDCapR")
library(REDCapR)

uri   <- "https://redcap.uantwerpen.be/api/"      # check the API URL on your server's API page
token <- Sys.getenv("REDCAP_TBCARE_TOKEN")

# 1. What is in the project?
redcap_project_info_read(uri, token)$data          # title, longitudinal, repeating, ...
arms    <- redcap_arm_export(uri, token)$data       # 2 arms
events  <- redcap_event_read(uri, token)$data       # 15 events
mapping <- redcap_event_instruments(uri, token)$data
meta    <- redcap_metadata_read(uri, token)$data    # the data dictionary
redcap_instrument_repeating(uri, token)$data        # adverse_events, concomitant_medications, unscheduled events

# 2. Read all records (raw codes), one request
ds <- redcap_read_oneshot(uri, token)$data
dim(ds)
table(ds$redcap_event_name)

# 3. Read only what you need: fields, forms, events, and labels instead of codes
clin <- redcap_read(
  redcap_uri  = uri, token = token,
  fields      = c("record_id"),
  forms       = c("clinical_assessment"),
  events      = c("baseline_arm_1", "month_2_arm_1", "month_6_arm_1"),
  raw_or_label = "label"
)$data
head(clin)

# 4. Repeating instrument: adverse events, one row per event
ae <- subset(ds, redcap_repeat_instrument == "adverse_events",
             select = c(record_id, redcap_repeat_instance, ae_term, ae_grade, ae_serious))
table(ae$ae_grade)
