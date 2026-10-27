# =============================================================================
# TBCARE · 04 · Data management with REDCapDM: transform, find queries, missing events
# A "query" is a question to the site about a value that looks wrong or is missing.
# =============================================================================
# install.packages("REDCapDM")    # run once
library(REDCapDM)

# --- Read the data: two options ----------------------------------------------
# Option A: directly from REDCap through the API (token from ~/.Renviron)
dataset <- redcap_data(uri = "https://redcap.uantwerpen.be/api/",
                       token = Sys.getenv("REDCAP_TBCARE_TOKEN"))

# Option B: from exported files. In REDCap: Data Exports > R (gives a .r script and a data file),
# plus the data dictionary, plus the instrument-event mapping (needed for longitudinal projects).
# dataset <- redcap_data(data_path  = "TBCARE_R_2026-10-26.r",
#                        dic_path   = "TBCARE_DataDictionary.csv",
#                        event_path = "TBCARE_instrument_event_mapping.csv")

# --- 1. Transform --------------------------------------------------------------
# rd_transform() prepares the raw export: codes become labelled factors, checkbox columns
# get readable names, and values hidden by branching logic are handled.
tb <- rd_transform(dataset)

# --- 2. Queries ----------------------------------------------------------------
# For each variable, an expression that describes a PROBLEM. x is the value being checked;
# | means OR; is.na(x) means "missing". Here: impossible weights and temperatures,
# and missing HIV status, at the baseline visit of arm 1.
q <- rd_query(tb,
              variables  = c("weight_kg", "temp_c", "hiv_status"),
              expression = c("x > 200 | x < 25", "x < 34 | x > 42", "is.na(x)"),
              event      = "baseline_arm_1")
q$results          # summary: how many queries per variable
head(q$queries)    # one row per query, ready to send to the sites

# --- 3. Missing events ---------------------------------------------------------
# rd_event() lists participants who have no record at all for an event:
# here, who has no month-6 visit in arm 1?
me <- rd_event(tb, event = "month_6_arm_1")
me$results

# --- 4. Send the queries, and check them later --------------------------------
# rd_export() writes the queries to an Excel file for the site staff.
rd_export(queries = q$queries, path = "TBCARE_queries.xlsx")
# After the sites have corrected the data in REDCap, run rd_query() again (q_after) and compare:
# check_queries() shows which queries are solved, still open, or new.
# check <- check_queries(old = q$queries, new = q_after$queries)
