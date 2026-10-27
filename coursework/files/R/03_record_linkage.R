# =============================================================================
# TBCARE · 03 · Deterministic record linkage with the national TB register
# Runs on the simulated files; no API needed.
# Linkage needs identifiers, so in real life the data manager does it in a secure
# environment. Only the link table (record_id <-> notification_id) and agreed variables
# are passed on to the analyst.
# =============================================================================
library(digest)   # install.packages("digest") - provides the SHA-256 hash function

# Read both files as text, so dates and codes are compared exactly as written
redcap <- read.csv("TBCARE_simulated_import.csv", colClasses = "character", na.strings = "")
reg    <- read.csv("TBCARE_national_TB_register.csv", colClasses = "character")

# One row per participant: the baseline event holds the identifiers we need.
# grepl("^baseline", x) is TRUE when x starts with "baseline" (^ means "starts with").
base <- subset(redcap, grepl("^baseline", redcap_event_name),
               select = c(record_id, dob, sex, district, last_name))
# The register only stores the first two letters of the surname, in capitals
base$last_name_2 <- toupper(substr(base$last_name, 1, 2))

# The linkage key: paste the four variables into one string (e.g. "1988-03-14|2|11|TU"),
# then hash it with SHA-256. A hash cannot be turned back into the original values
# (pseudonymisation), but identical input always gives an identical hash.
# vapply() applies digest() to every string and returns a character vector.
make_key <- function(dob, sex, district, ln2)
  vapply(paste(dob, sex, district, ln2, sep = "|"), digest, "", algo = "sha256", serialize = FALSE)

base$key <- make_key(base$dob, base$sex, base$district, base$last_name_2)
reg$key  <- make_key(reg$dob,  reg$sex,  reg$district,  reg$last_name_2)

# Deterministic linkage = records with exactly the same key belong together.
# merge(..., all.x = TRUE) keeps every TBCARE participant (a "left join");
# participants without a match get NA in notification_id.
linked <- merge(base[, c("record_id", "key")], reg[, c("notification_id", "key", "notification_date")],
                by = "key", all.x = TRUE)

# Report how many linked. is.na() is TRUE for missing values; ! means NOT.
cat("Participants:", nrow(base), " linked:", sum(!is.na(linked$notification_id)),
    " not linked:", sum(is.na(linked$notification_id)), "\n")

# Who did not link? Check them by hand (typos in the date of birth, never notified, ...)
linked$record_id[is.na(linked$notification_id)]

# Keep only the link table; drop the identifiers and the key before any analysis
link_table <- linked[, c("record_id", "notification_id", "notification_date")]
