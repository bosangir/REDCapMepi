# =============================================================================
# TBCARE · 02 · Upload the simulated data through the API
# (an alternative to the Data Import Tool on the REDCap website)
# Use only in your PRACTICE project, while it is in Development status.
# =============================================================================
library(REDCapR)
uri   <- "https://redcap.uantwerpen.be/api/"
token <- Sys.getenv("REDCAP_TBCARE_TOKEN")     # token from ~/.Renviron (see script 01)

# Read the simulated file.
# colClasses = "character": keep every value as text, exactly as written in the file
#   (so "1-001" stays "1-001" and "2025-03-04" is not changed into a date).
# na.strings = "": empty cells become NA, which REDCap treats as "no value".
sim <- read.csv("TBCARE_simulated_import.csv", colClasses = "character", na.strings = "")

# Check the data frame before sending it. validate_for_write() lists likely problems,
# such as column names REDCap will not accept. An empty result means no problems were found.
validate_for_write(sim)

# Send the rows to REDCap, 100 rows per request (batches are kinder to the server).
res <- redcap_write(sim, redcap_uri = uri, token = token, batch_size = 100)
res$success      # TRUE if every batch was accepted
print(res)       # rows written, elapsed time, any problems

# Tip: the column redcap_data_access_group only works if the two Data Access Groups exist
# with the unique names antwerp and mbarara. If you did not create them, drop the column:
#   sim$redcap_data_access_group <- NULL
