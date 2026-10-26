# TBCARE · 02 · Upload the simulated data through the API (alternative to the Data Import Tool)
# Use only in your PRACTICE project, in Development status.
library(REDCapR)
uri   <- "https://redcap.uantwerpen.be/api/"
token <- Sys.getenv("REDCAP_TBCARE_TOKEN")

sim <- read.csv("TBCARE_simulated_import.csv", colClasses = "character", na.strings = "")

# Check the data frame before writing (REDCapR validators)
validate_for_write(sim)

# Write in batches of 100 rows; returns the number of records affected
res <- redcap_write(sim, redcap_uri = uri, token = token, batch_size = 100)
res$success
print(res)          # rows written, elapsed time, any problems

# Tip: create the two Data Access Groups first (unique names 'antwerp' and 'mbarara'),
# otherwise drop the column:  sim$redcap_data_access_group <- NULL
