from . import auth
from . import devices
from . import main

# Make the blueprints available at package level
bp_auth = auth.bp
bp_devices = devices.bp
bp_main = main.bp