# Networking Items

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

## Enhanced Avahi mDNS Metadata for Device Discovery

### Summary

To support the **Elements Technician App** and improve device discoverability, the default Avahi mDNS broadcasting was extended to include structured metadata. This enabled user-friendly identification and filtering of devices on the network based on key attributes like serial number, firmware version, and commission status — beyond the basic hostname.

Avahi previously only advertised the `_ssh._tcp` service with minimal or no TXT records.

Users and technician tools had no way to programmatically distinguish device types or firmware versions in a local `.local` network environment.

### Implementation Overview

Created `/usr/libexec/titan-startup-tasks/update-avahi-service.sh` to:

Extract dynamic runtime values from system sources:

* `fw_printenv serial_number`
* `/etc/os-release`
* `/etc/hwrevision`
* `/etc/everest/config-titan.yaml`

Build a custom Avahi XML service file at `/etc/avahi/services/ssh.service` with:

```
<txt-record>serial_number=PTD701</txt-record>
<txt-record>firmware_version=0.17.7</txt-record>
<txt-record>commissioned=no</txt-record>
<txt-record>connectors=2</txt-record>
```

Restart `avahi-daemon` after update to reflect live changes.

### Tech Notes

#### Avahi Static Service Files

You can create custom Avahi service definitions in `/etc/avahi/service/*.service`. These are XML files that Avahi reads and advertises on the network.

```
<service-group>
  <name replace-wildcards="yes">%h</name>  <!-- %h = current hostname -->
  <service>
    <type>_ssh._tcp</type>
    <port>9022</port>
    <txt-record>serial_number=PTD701</txt-record>
    <txt-record>firmware_version=0.17.7</txt-record>
  </service>
</service-group>
```

#### Dynamic Configuratoin via Scripts

Avahi does not dynamically watch for config changes in TXT records unless the XML file is rewritten and the service is restarted.

#### Tools for Testing and Debugging

```
avahi-browse -a -t  # Browse all active mDNS services
avahi-resolve-host-name titan-rev2-b.local #Check name resolution
dns-sd -B _ssh._tcp # (on macOS) Bonjour-compatible browsing
mdns-scan or avahi-discover # (GUI) For a graphical view
```

#### Pitfalls to Avoid

TXT records exceeding 255 bytes or 9 entries may silently fail on some clients.

Avahi may cache hostname -> IP mapping; always flush with restart avahi-daemon system service.

Don't forget to use correct `replace-wildcards="yes"` if using `%h` or `%n`.

## Avoiding Failures on Systems Without Avahi

Older builds may not include `avahi-daemon`, leading to script errors or failed `systemctl` calls during upgrade or install.

Improved this logic in preinstall scripts: `systemctl is-active --quiet avahi-daemon && systemctl stop avahi-daemon 2>/dev/null`

* **`systemctl is-active --quiet avahi-daemon`**
  * Checks if the `avahi-daemon` systemd service is **currently active (running)**.
  * `--quiet` suppresses all output (no "active" or "inactive" printed).
  * Returns:
    * Exit code `0` if **active**
    * Exit code `1` if **inactive**
    * Exit code `3` if **not found**
* **`&&` (Logical AND)**
  * Only runs the next command if the previous command **returns exit code 0** (i.e., the service is active).
* **`systemctl stop avahi-daemon 2>/dev/null`**
  * Stops the service.
  * `2>/dev/null` silences **stderr**, so even if something goes wrong (e.g. permission denied), no error message clutters the logs.
