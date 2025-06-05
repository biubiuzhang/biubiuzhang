# My Achievements

## Full Hostname Not Broadcast via mDNS (Avahi)

### Summary

Devices on the network were broadcasting incomplete hostnames over mDNS, omitting the serial number portion (e.g., `titan-rev1-b` instead of the expected `titan-rev1-b-PTD701`). This caused confusion during identification and made it impossible to SSH into devices using their full advertised hostname, which should include the serial number for uniqueness and traceability. Temp workaround is appending the serial number to hostname and restart Avahi service in a startup task script. Ensure full hostname is broadcast via mDNS.

### Deep Dive

In the Titan embedded system, the actual hostname is dynamically composed at runtime:

* Base hostname: machine type (e.g., `titan-rev1-b`)
* Suffix: unique serial number (e.g., `PTD701`)
* Final expected hostname: `titan-rev1-b-PTD701`

This override is often performed **after system boot begins**, using a startup script (e.g., `titan-startup-tasks.sh`) that reads the serial number from:

* EEPROM
* Manufacturing config file
* U-Boot environment, etc

`avahi-daemon` is a service that advertises the hostname via mDNS. It usually starts early in the boot process and captures the hostname from systemd (via `gethostname()` or `/etc/hostname`).

**Key problem:**

* `avahi-daemon` starts **before** the `set-hostname` override script has run.
* So Avahi picks up just the **base name** (`titan-rev1-b`), not the serial-appended one.
* Even though the override occurs later, Avahi **doesn’t re-read** the hostname unless explicitly restarted.

This mismatch clearly indicates a race condition or improper service startup ordering.

### Fix Summary

1. Ensure hostname override happens before Avahi starts (e.g., via an earlier systemd unit).
2. Or, as a workaround: restart Avahi after setting hostname.

Optional hardening:

* Write final hostname to `/etc/hostname` early in boot process.
* Use systemd dependency (`After=systemd-hostnamed.service`) to ensure Avahi waits.

This is a great real-world example of:

* **Race conditions between systemd units**
* **Service startup timing bugs**
* **Avahi/hostname integration quirks**
* The need for **deterministic system identity for mDNS-based discovery**

```
# Use the following command in your host to check the board's mDNS broadcast
sudo rm -rf /var/cache/avahi-daemon/*
sudo systemctl restart avahi-daemon
avahi-browse _ssh._tcp --ignore-local --resolve --terminate
# Titan side useful commands
hostnamectl
```
