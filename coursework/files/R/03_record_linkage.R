# TBCARE · 03 · Deterministic record linkage with the national TB register
# Runs on the simulated files; no API needed.
# Linkage needs identifiers, so it is done by the data manager in a secure environment.
# Only the link (record_id <-> notification_id) and agreed variables leave that environment.

library(digest)   # install.packages("digest")

redcap <- read.csv("TBCARE_simulated_import.csv", colClasses = "character", na.strings = "")
reg    <- read.csv("TBCARE_national_TB_register.csv", colClasses = "character")

# One row per participant from the baseline event
base <- subset(redcap, grepl("^baseline", redcap_event_name),
               select = c(record_id, dob, sex, district, last_name))
base$last_name_2 <- toupper(substr(base$last_name, 1, 2))

# Pseudonymised linkage key: hash of date of birth + sex + district + first 2 letters of surname
make_key <- function(dob, sex, district, ln2)
  vapply(paste(dob, sex, district, ln2, sep = "|"), digest, "", algo = "sha256", serialize = FALSE)

base$key <- make_key(base$dob, base$sex, base$district, base$last_name_2)
reg$key  <- make_key(reg$dob,  reg$sex,  reg$district,  reg$last_name_2)

linked <- merge(base[, c("record_id", "key")], reg[, c("notification_id", "key", "notification_date")],
                by = "key", all.x = TRUE)

cat("Participants:", nrow(base), " linked:", sum(!is.na(linked$notification_id)),
    " not linked:", sum(is.na(linked$notification_id)), "\n")

# Who did not link? Check them by hand (typos in date of birth, not notified, ...)
linked$record_id[is.na(linked$notification_id)]

# Keep the link table only; drop identifiers and the key before analysis
link_table <- linked[, c("record_id", "notification_id", "notification_date")]
