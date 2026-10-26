# TBCARE · 04 · Data management with REDCapDM: transform, find queries, missing events
# install.packages("REDCapDM")
library(REDCapDM)

# Option A: from the API
dataset <- redcap_data(uri = "https://redcap.uantwerpen.be/api/",
                       token = Sys.getenv("REDCAP_TBCARE_TOKEN"))

# Option B: from exported files (Data Exports > R script + data, plus the data dictionary
# and the instrument-event mapping for longitudinal projects)
# dataset <- redcap_data(data_path  = "TBCARE_R_2026-10-26.r",
#                        dic_path   = "TBCARE_DataDictionary.csv",
#                        event_path = "TBCARE_instrument_event_mapping.csv")

# 1. Transform: factors with labels, checkboxes, branching logic applied
tb <- rd_transform(dataset)

# 2. Queries: missing values and impossible values at baseline
q <- rd_query(tb,
              variables  = c("weight_kg", "temp_c", "hiv_status"),
              expression = c("x > 200 | x < 25", "x < 34 | x > 42", "is.na(x)"),
              event      = "baseline_arm_1")
q$results          # summary per variable
head(q$queries)    # one row per query, ready to send to the sites

# 3. Missing events: who has no month-6 visit?
me <- rd_event(tb, event = "month_6_arm_1")
me$results

# 4. Export the queries for the sites, and later compare with a new run
rd_export(queries = q$queries, path = "TBCARE_queries.xlsx")
# check <- check_queries(old = q$queries, new = q_after_correction$queries)
