import os
import logging

log_handler = logging.StreamHandler()

formatter = logging.Formatter("[%(asctime)s] %(levelname)s [%(name)s]"
                              " [%(filename)s:%(lineno)s %(funcName)20s()]"
                              " - %(message)s")
log_handler.setFormatter(formatter)

LOG_LEVEL = eval("logging." + os.environ.get("LOG_LEVEL", "INFO"))
