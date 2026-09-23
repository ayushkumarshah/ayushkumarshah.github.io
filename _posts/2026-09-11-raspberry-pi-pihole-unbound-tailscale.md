---
title: "Resurrecting a 2015 Raspberry Pi: Data Recovery, Pi-hole, Unbound and Tailscale"
date: 2026-09-11 17:00
categories: [raspberry-pi]
summary: A full account of rescuing data from a dead Raspberry Pi SD card on macOS, diagnosing an 11-year-old board that refused to boot, and turning it into a network-wide ad blocker with recursive DNS and remote filtering — including every failure along the way.
tags:
    - raspberry-pi
    - pihole
    - unbound
    - tailscale
    - dns
    - networking
    - linux
    - macos
    - debugging
author: Ayush Kumar Shah
layout: longform
---

I found my old Raspberry Pi 3 Model B (V1.2, 2015) in a drawer. The last time it ran was June 2021. I wanted two things from it: the files still sitting on its SD card, and a second life as something useful.

Both took considerably longer than expected. This post documents the whole thing — the data recovery, a board that intermittently refused to boot, a two-hour debugging detour caused by a macOS privacy setting, an ad-blocking setup that hit a hard wall on AT&T hardware, and the workarounds that finally made it all work.

I've kept the failures in. They were most of the work, and the reasoning that resolved them is more useful than the final command list.

> **A note on placeholders.** Private addresses (`192.168.1.x`) are shown as-is, since they're the same on most home networks and make the commands concrete. Tailscale addresses and MAC addresses are redacted as `<PI_TS_IP>` and `b8:27:eb:xx:xx:xx`.

---

## Part 1 — Getting the data off an ext4 SD card on macOS

The Pi's root partition is **ext4**, which macOS cannot read natively. Every guide online says the same thing: install macFUSE and ext4fuse.

That advice is dated, and on Apple Silicon it's the hard path.

### Why the standard advice fails

```bash
brew install macfuse   # wrong — it's a cask
brew install ext4fuse
```

Three problems:

1. **macFUSE is a kernel extension.** On Apple Silicon you must boot into Recovery, drop to **Reduced Security**, enable "Allow user management of kernel extensions", reboot, approve it in Privacy & Security, and reboot again. That permanently lowers your Mac's security posture to read an SD card.
2. **`ext4fuse` is deprecated in Homebrew** — unmaintained upstream, scheduled for removal, and its own analytics showed more build failures than successful installs.
3. `brew install macfuse` is wrong anyway; it's a cask.

### The better way: `debugfs`

`debugfs`, from `e2fsprogs`, reads ext4 directly from the raw block device in pure userspace. No kernel extension, no reboot, read-only by default.

```bash
brew install e2fsprogs
```

It's keg-only, so it lives at `/opt/homebrew/opt/e2fsprogs/sbin/debugfs`.

**Find the partition:**

```bash
diskutil list
```

```
/dev/disk4 (external, physical):
   #:              TYPE NAME          SIZE       IDENTIFIER
   0: FDisk_partition_scheme         *32.0 GB    disk4
   1:    Windows_FAT_32 boot          43.8 MB    disk4s1
   2:             Linux               32.0 GB    disk4s2
```

`disk4s1` is the FAT boot partition — macOS mounts that natively. `disk4s2` is the ext4 root.

**Browse it:**

```bash
sudo /opt/homebrew/opt/e2fsprogs/sbin/debugfs -R "ls -l /home" /dev/disk4s2
```

Modern Raspberry Pi OS has no default `pi` user, so check before assuming the path.

**Copy a directory out:**

```bash
mkdir -p ~/Desktop/rpi_files
sudo /opt/homebrew/opt/e2fsprogs/sbin/debugfs \
  -R "rdump /home/pi /Users/YOU/Desktop/rpi_files" /dev/disk4s2
sudo chown -R $(whoami) ~/Desktop/rpi_files
```

Notes that matter:

- `rdump` creates the source's **basename inside** the destination — you get `rpi_files/pi/`, not the contents loose.
- **Never pass `-w`.** Without it `debugfs` is strictly read-only. With it you can corrupt the card.
- `debugfs` writes files out as root and then restores the *source* ownership (uid 1000 from the Pi), which won't map to your Mac account. The `chown` at the end is what makes them yours.
- It doesn't replay the ext4 journal, so on an uncleanly shut down card the most recent writes may be missing. Everything older reads fine.

**Result:** 465 MB recovered in about four minutes (~2 MB/s — a tree of many small files, so per-file overhead dominates).

**Eject properly** — you never mounted anything, so `umount` doesn't apply:

```bash
diskutil eject /dev/disk4
```

### Reading the boot partition

The FAT partition mounts natively and is worth inspecting. One gotcha: macOS writes `.Spotlight-V100` and `.fseventsd` onto it. Harmless for booting, but you can stop it:

```bash
rm -rf /Volumes/bootfs/.Spotlight-V100 /Volumes/bootfs/.fseventsd
touch /Volumes/bootfs/.metadata_never_index
```

---

## Part 2 — The board wouldn't boot

With the data safe, I reflashed the card. Then the Pi showed nothing on HDMI.

### Read the LEDs first

The single most useful diagnostic on a Pi:

| LEDs | Meaning |
|---|---|
| No red PWR | Power supply or cable problem |
| Red steady, green ACT never blinks | The board isn't reading the SD card at all |
| Green blinks irregularly at boot | Card is being read — likely an HDMI problem instead |
| Green blinks a repeating pattern | Firmware error code (count the blinks) |

I had **red steady, green ACT dark** — failure at the earliest possible stage, before anything on the card matters.

### What I ruled out, and how

The card read perfectly on my Mac, so I verified its structure at the byte level rather than guessing:

```bash
# MBR: disk signature, partition type, boot signature
sudo dd if=/dev/rdisk4 bs=512 count=1 2>/dev/null | xxd -s 440 -l 72

# FAT32 boot sector of the boot partition
sudo dd if=/dev/rdisk4s1 bs=512 count=1 2>/dev/null | xxd | head -6
```

What to look for:

| Field | Offset | Expected |
|---|---|---|
| Disk signature | 440 | must match `PARTUUID=` in `cmdline.txt` |
| Partition 1 type | 450 | `0c` (FAT32 LBA) |
| MBR signature | 510 | `55 aa` |

Everything checked out — correct type byte, aligned start LBA, matching PARTUUID, valid `mkfs.fat` boot sector, all firmware files (`bootcode.bin`, `start.elf`, `bcm2710-rpi-3-b.dtb`, `kernel8.img`) present.

So the card was fine. Which left power, the SD slot, or the board.

### It was power

Eventually an **undervoltage warning** appeared. That single observation explained the entire history:

| Symptom | Cause |
|---|---|
| `unable to read itable block`, aborted ext4 journal | SD card browning out mid-read |
| Red steady, ACT never blinks | Rail too low to initialise the card at all |
| Worked, then didn't, then did | Classic marginal-power intermittency |

The Pi 3 B raises that warning below ~4.63 V, and the SD card runs off the same rail.

**Check it directly:**

```bash
vcgencmd get_throttled
```

| Value | Meaning |
|---|---|
| `0x0` | Clean |
| `0x50000` | Undervoltage **has occurred** since boot |
| `0x50005` | Undervoltage happening **right now** |

### The fix, and what actually matters

The **cable** matters more than the adapter. A typical micro-USB cable uses 28 AWG for data and **26 AWG for power** — thin enough to drop significant voltage at the 2.5 A a Pi 3 can draw. That's why a charger that works fine for a phone fails here: phones negotiate low current, a Pi just draws.

- Use a supply rated **5.1 V / 2.5 A** (the 5.1 V is deliberate — headroom for cable loss)
- Power conductors **20 AWG or thicker**, as short as possible
- Best option: a supply with a **captive cable**, so there's no cable to get wrong
- Also worth taking the board out of its case — shells can hold the SD card a fraction short of full engagement

After replacing it: `throttled=0x0`, and zero `mmc0`/`EXT4-fs` errors since.

---

## Part 3 — Cloud-init wedged the first boot

The freshly flashed card booted to a splash screen and stopped. For over an hour.

Modern Raspberry Pi Imager customisation writes **cloud-init** files to the boot partition: `user-data`, `meta-data`, `network-config`. Mine contained:

```yaml
packages:
- avahi-daemon
```

That stage runs over the network, **before** `runcmd` — and `runcmd` is where `systemctl enable --now ssh` lives. Apt stalled, cloud-init never reached `runcmd`, and SSH never started. `cloud-final.service` gates the boot, so Plymouth sat on the splash indefinitely.

Diagnosing it was harder than it needed to be because `quiet splash` hides everything.

### The fix — three edits on the boot partition

macOS can write to the FAT partition natively, so no Linux machine is needed.

**1. Remove the blocking package stage** from `user-data`:

```bash
sed -i '' '/^packages:$/,/^- avahi-daemon$/d' /Volumes/bootfs/user-data
```

`avahi-daemon` ships in the base image anyway — mDNS worked before cloud-init ever finished.

**2. Force cloud-init to re-run.** It records which instance it has provisioned and skips otherwise. The instance ID appears in **two** places and both must match:

```bash
# meta-data
printf 'instance-id: rpi-retry2\n' > /Volumes/bootfs/meta-data
```

and the `i=` parameter inside `cmdline.txt`.

**3. Make the boot visible.** Remove `quiet splash` from `cmdline.txt` and add `systemd.show_status=1`.

> **Critical:** `cmdline.txt` must stay a **single line**, and you must preserve `root=PARTUUID=...` exactly. The first-boot resize regenerates the disk signature and rewrites this file, so the value may not be what was originally flashed. Copy the existing file first:
> ```bash
> cp /Volumes/bootfs/cmdline.txt /Volumes/bootfs/cmdline.txt.bak
> ```

After that the Pi booted, cloud-init completed, and `sshd` started.

### Cleaning up cloud-init afterwards

Once provisioned, cloud-init causes more problems than it solves — it re-asserts the hostname on every boot and rewrites netplan config:

```bash
sudo touch /etc/cloud/cloud-init.disabled
```

---

## Part 4 — Two hours lost to a macOS privacy setting

This was the most frustrating problem of the project, and the lesson generalises well beyond Raspberry Pis.

The Pi was up, `sshd` was `active (running)`, the correct key was in `authorized_keys` — and my Mac could not reach it.

### What the symptoms looked like

```
$ ssh ayush@192.168.1.218
ssh: connect to host 192.168.1.218 port 22: No route to host
```

Measurements that seemed contradictory:

- Pi → Mac: **0% packet loss**
- Mac → Pi: **100% loss**
- Both machines reached the router fine
- Same subnet, same gateway
- No firewall rules on either machine (`nft list ruleset` empty)
- `throttled=0x0`, so not power
- Correct ARP entry present, yet ICMP unanswered
- **IPv6 failed identically to IPv4**

I burned hours on wrong theories: undervoltage, WiFi power saving, cross-band isolation on the router, dual interfaces on one subnet, MAC randomisation, stale ARP cache.

### The clue I under-weighted

```
ping: sendto: No route to host
```

**`sendto` is a local system call.** That error is the kernel refusing to transmit — not a timeout, not a remote rejection. And IPv4 (ARP) and IPv6 (NDP) are completely different neighbour-discovery mechanisms. Both failing identically, at the *send* stage, means the failure is above the protocol layer.

The other clue: **the router was reachable, everything else wasn't.**

### The cause

macOS 15 introduced a **Local Network privacy permission**. Apps must be granted permission to reach devices on the LAN — and the implementation **exempts the gateway** so internet keeps working, while silently blocking peer-to-peer traffic.

My terminal emulator's permission was off. Every LAN connection it attempted was dropped by the OS before reaching the network.

**Fix:** System Settings → **Privacy & Security → Local Network** → enable your terminal app.

Two subtleties:

- If you run **tmux**, the tmux server is launched by `launchd` and gets judged separately from the terminal app. Enable both.
- The permission takes effect on app restart.

The moment it was enabled: ping worked, port 22 opened, SSH connected.

> **The generalisable lesson:** `sendto: No route to host` means your own machine refused to send. Distinguish local send errors from timeouts before you start blaming the network. I didn't, and it cost me two hours.

Interestingly, the community AT&T/Pi-hole guide I found later carries exactly this warning — it's a common trap.

---

## Part 5 — Installing Pi-hole

### Fixing apt first

The interrupted cloud-init left a truncated package list:

```
E: Unable to parse package file /var/lib/apt/lists/...Packages (1)
E: The package cache file is corrupted
```

`apt update` can't fix this, because the broken file is already on disk:

```bash
sudo rm -rf /var/lib/apt/lists/*
sudo rm -f /var/cache/apt/*.bin
sudo apt-get clean
sudo apt-get update
sudo dpkg --configure -a
```

### Install

```bash
curl -sSL https://install.pi-hole.net | bash
```

Choices worth thinking about:

- **Upstream DNS** — I'd avoid Google here; routing every household DNS query to Google sits oddly with installing an ad blocker. Cloudflare or Quad9 are better fits. (This becomes moot in Part 8.)
- **Query logging: yes.** Without it the most common Pi-hole task — "site X is broken, what got blocked?" — is impossible.
- **Privacy level: 0 (show everything).** Higher levels strip exactly what the log is for. The "privacy" here is from whoever can see your dashboard, which is you.

### The static IP trap

Pi-hole's installer shows a "Static IP Needed" dialog, but on current Raspberry Pi OS **it doesn't configure anything** — its static-IP code targets `dhcpcd`, which has been replaced by NetworkManager. The dialog is advisory only.

Verify what you actually have:

```bash
nmcli -t -g ipv4.method connection show netplan-eth0
```

`auto` means DHCP. To pin it:

```bash
sudo nmcli connection modify netplan-eth0 ipv4.method manual \
  ipv4.addresses 192.168.1.218/24 \
  ipv4.gateway 192.168.1.254 \
  ipv4.dns "127.0.0.1"
sudo nmcli connection up netplan-eth0
```

`ipv4.dns 127.0.0.1` makes the Pi use its own Pi-hole — the post-install step the docs describe via `/etc/dhcpcd.conf`, which no longer applies.

> If cloud-init is still enabled, it will overwrite netplan-derived connections. Disable it (Part 3) before relying on this.

**Verify:**

```bash
dig +short doubleclick.net @192.168.1.218   # 0.0.0.0 = blocked
dig +short github.com @192.168.1.218        # real address
```

---

## Part 6 — Network-wide filtering, and why it failed

Per-device DNS works but doesn't cover new devices. The standard solution is to let Pi-hole serve DHCP so every client automatically receives it as their DNS server.

**AT&T gateways don't allow changing the DNS handed to LAN clients.** No BGW model ever has. So DHCP takeover is the only route — and on my gateway it does not work.

### What I tried

```bash
# Verify Pi-hole's DHCP config
sudo pihole-FTL --config dhcp.active     # true
sudo pihole-FTL --config dhcp.start      # 192.168.1.100
sudo pihole-FTL --config dhcp.end        # 192.168.1.200
sudo pihole-FTL --config dhcp.router     # 192.168.1.254

# Confirm it's actually bound
sudo ss -ulnp '( sport = :67 )'          # pihole-FTL on 0.0.0.0:67
```

Note there is **no** `dhcp.interface` in Pi-hole v6 — DHCP follows `dns.interface` and `dns.listeningMode`.

All correct. Yet with the gateway's DHCP disabled, clients got `169.254.x.x` — no DHCP response at all. Four attempts, including a patient ten-minute wait, and with IPv6 disabled at the gateway.

### Proving it with packet capture

Logs can mislead; packets can't.

```bash
sudo apt-get install -y tcpdump
sudo tcpdump -ni any port 67 or port 68 or arp
```

Then toggle WiFi off/on **from the menu bar** on a client — not via `ipconfig`, which may send a *unicast* renewal straight to the old server and never broadcast at all. (This subtlety invalidated one of my earlier tests.)

The result was decisive:

```
ARP, Request who-has 192.168.1.218 tell 192.168.1.210   ← client broadcast, RECEIVED
ARP, Request who-has 192.168.1.99  tell 192.168.1.210   ← RECEIVED
...
(no DHCP packets, ever)
```

**Client ARP broadcasts reach the Pi. DHCP broadcasts never do.** The gateway bridges ordinary broadcast traffic but filters DHCP specifically — rogue-DHCP-server protection. No Pi-hole configuration can work around that.

**Conclusion:** on a BGW-series AT&T gateway, Pi-hole DHCP is impossible. Network-wide would require IP Passthrough plus your own router.

### The genuinely valuable discovery: IPv6 bypass

While debugging, I noticed something that had been quietly defeating Pi-hole the whole time:

```bash
scutil --dns | grep -m3 'nameserver\['
```

```
nameserver[0] : 2600:xxxx:xxxx:xxxx::1     ← the gateway, over IPv6
nameserver[1] : 192.168.1.254
```

Even with DNS manually set to the Pi, **macOS preferred the IPv6 resolver the gateway advertised** via router advertisements. Queries went to AT&T and skipped Pi-hole entirely. A test domain resolved to a real address instead of `0.0.0.0`.

This is the most common reason Pi-hole "doesn't work" on AT&T hardware.

**Fix at the gateway** — Home Network → IPv6:

| Setting | Value |
|---|---|
| **IPv6** | **Off** |
| DHCPv6 | Off |
| DHCPv6 Prefix Delegation | Off |

Turning it off at the gateway rather than per-device matters, because **iOS gives you no way to disable IPv6 per network**. Without this, an iPhone silently bypasses Pi-hole no matter what DNS you configure.

**Verify:**

```bash
dscacheutil -flushcache
dscacheutil -q host -a name doubleclick.net
```

You want `ip_address: 0.0.0.0` and `ipv6_address: ::` — both blocked.

After this, every device pointed at the Pi is genuinely filtered. That recovered most of the value of "network-wide" without any DHCP changes.

### Pointing devices at Pi-hole

| Device | DNS to use |
|---|---|
| Stationary (Apple TV, consoles, desktops) | `192.168.1.218` |
| Travels, runs Tailscale | Nothing — handled automatically (Part 7) |

On iOS: Settings → Wi-Fi → ⓘ → Configure DNS → Manual.

**Also turn off "Limit IP Address Tracking"** on that screen. That's iCloud Private Relay, which tunnels Safari's DNS through Apple and bypasses Pi-hole completely.

---

## Part 7 — Tailscale: filtering that follows you

A LAN address only works on the LAN. Leave the house and your phone falls back to the carrier's DNS. iOS doesn't even offer a DNS field for cellular.

[Tailscale](https://tailscale.com/) fixes this by giving the Pi an address reachable from anywhere.

### On the Pi

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up          # prints a URL to authenticate
tailscale ip -4            # e.g. <PI_TS_IP>
```

### The step that's easy to miss

Pi-hole defaults to `dns.listeningMode = LOCAL`, meaning it only answers queries from its own subnet. Tailscale clients arrive from `100.64.0.0/10` — a different range — so Pi-hole **refuses them silently**, and it looks like Tailscale is broken when it isn't.

```bash
sudo pihole-FTL --config dns.listeningMode ALL
sudo systemctl restart pihole-FTL
```

`ALL` is fine on a machine reachable only via your LAN and your private Tailnet. Never expose port 53 to the internet with this set.

### In the Tailscale admin console

At **login.tailscale.com/admin/dns**:

1. **Add nameserver → Custom** → the Pi's Tailscale IP
2. Turn **Override DNS servers** **ON**

Without that toggle, devices only use the Pi for Tailnet-internal names.

**Use only that one nameserver.** Tailscale distributes queries across all listed nameservers, so adding a public fallback would let a share of your traffic bypass Pi-hole entirely.

### On clients

```bash
brew install --cask tailscale   # macOS
```

Plus the app from the App Store on iOS. Same account everywhere.

**Verify:**

```bash
tailscale status
dig +short doubleclick.net      # 0.0.0.0, wherever you are
```

### What you get

| Device | At home | Away |
|---|---|---|
| MacBook | ✅ | ✅ |
| iPhone | ✅ | ✅ (including cellular) |

Plus SSH and the Pi-hole admin page from anywhere, with nothing exposed to the internet and no port forwarding.

**The trade-off:** with "Override DNS servers" on, the Pi becomes a DNS dependency for connected devices. If it's down while you're out, name resolution stops until you toggle Tailscale off on that device.

Keeping the manual `192.168.1.218` on your home WiFi is a useful backstop for when Tailscale is off at home. The two don't conflict — Tailscale takes precedence when connected.

---

## Part 8 — Unbound: recursive DNS

Pi-hole filters, but it still **forwards** everything it doesn't block to an upstream resolver. That upstream sees every domain your household looks up — a complete browsing record tied to your home IP.

You're blocking ad companies from tracking you while handing the same information to one company in a single stream.

[Unbound](https://docs.pi-hole.net/guides/dns/unbound/) resolves recursively instead, walking down from the root servers itself.

**Before:** `Mac → Pi-hole → Cloudflare → answer`

**After:** `Mac → Pi-hole → unbound → root → .com → github.com's nameservers`

No single party sees the whole picture. The root servers learn only that someone asked about `.com`; the `.com` servers learn about one domain, not the rest of your browsing.

### Install and configure

```bash
sudo apt install -y unbound
```

`dns-root-data` comes with it and keeps root hints current automatically.

```bash
sudo tee /etc/unbound/unbound.conf.d/pi-hole.conf > /dev/null <<'EOF'
server:
    verbosity: 0
    interface: 127.0.0.1
    port: 5335
    do-ip4: yes
    do-udp: yes
    do-tcp: yes
    do-ip6: yes
    prefer-ip6: no

    harden-glue: yes
    harden-dnssec-stripped: yes
    use-caps-for-id: no

    edns-buffer-size: 1232
    prefetch: yes
    num-threads: 1
    so-rcvbuf: 1m

    private-address: 192.168.0.0/16
    private-address: 169.254.0.0/16
    private-address: 172.16.0.0/12
    private-address: 10.0.0.0/8
    private-address: fd00::/8
    private-address: fe80::/10
    private-address: 192.0.2.0/24
    private-address: 198.51.100.0/24
    private-address: 203.0.113.0/24
    private-address: 255.255.255.255/32
    private-address: 2001:db8::/32
EOF
```

On Debian Bullseye and later, stop resolvconf fighting it:

```bash
sudo systemctl disable --now unbound-resolvconf.service
sudo sed -Ei 's/^unbound_conf=/#unbound_conf=/' /etc/resolvconf.conf
sudo rm -f /etc/unbound/unbound.conf.d/resolvconf_resolvers.conf
sudo systemctl restart unbound
```

### Test before switching

This matters — if unbound isn't answering and you've already removed the other upstreams, DNS stops for every device.

```bash
dig pi-hole.net @127.0.0.1 -p 5335            # expect NOERROR
dig fail01.dnssec.works @127.0.0.1 -p 5335    # expect SERVFAIL
dig +ad dnssec.works @127.0.0.1 -p 5335       # expect NOERROR with 'ad' flag
```

The **SERVFAIL is the success case** — that domain has a deliberately broken signature, so refusing it proves DNSSEC validation works.

The very first query may time out while unbound builds its trust chain from cold. Retry once.

### Point Pi-hole at it

Admin → **Settings → DNS** → Custom DNS servers → `127.0.0.1#5335`, and **untick every other upstream**.

> Leaving Cloudflare ticked alongside means Pi-hole load-balances across all of them — roughly two thirds of your DNS would still go to Cloudflare, defeating the point entirely.

### What it costs

First lookup of a new domain is a few hundred milliseconds slower while unbound walks the hierarchy. Cached lookups are then *faster* than before, since the answer is on your own LAN. `prefetch: yes` refreshes popular entries before they expire.

There's no fallback resolver — but unbound runs on the same machine as Pi-hole, so they fail together anyway.

**In one line:** Pi-hole decides *what* you're allowed to look up; unbound changes *who finds out that you looked.*

---

## Part 9 — Finishing touches

### Renaming the user after the fact

I'd set the wrong username at imaging time. You can't rename an account while it's logged in, and it was the only account — so it needs a temporary admin:

```bash
sudo useradd -m -s /bin/bash tmpadmin
sudo usermod -aG sudo tmpadmin
sudo passwd tmpadmin

# password auth is often disabled, so give it the same SSH key
sudo mkdir -p /home/tmpadmin/.ssh
sudo cp /home/olduser/.ssh/authorized_keys /home/tmpadmin/.ssh/
sudo chown -R tmpadmin:tmpadmin /home/tmpadmin/.ssh
sudo chmod 700 /home/tmpadmin/.ssh
sudo chmod 600 /home/tmpadmin/.ssh/authorized_keys
```

Then log in as `tmpadmin` and expect this:

```
usermod: user olduser is currently used by process 1099
```

Even with no login session. The culprit is a **lingering systemd user session** — cloud-init runs `loginctl enable-linger` to keep `rpi-connect` alive:

```bash
sudo loginctl disable-linger olduser
sudo loginctl terminate-user olduser
pgrep -u olduser          # must be empty
```

Then:

```bash
sudo usermod -l ayush -d /home/ayush -m olduser
sudo grep -rl olduser /etc/sudoers.d/     # fix any match or you lose sudo
```

Debian renames the user's private group automatically (`USERGROUPS_ENAB`), so a follow-up `groupmod` will report the group doesn't exist. That's expected.

Finally, restore linger under the new name and clean up:

```bash
sudo rm -f /var/lib/systemd/linger/olduser
sudo loginctl enable-linger ayush
sudo touch /etc/cloud/cloud-init.disabled
sudo userdel -r tmpadmin      # only after verifying the new user can sudo
```

`-m` moves the home directory, so `.ssh` and any app config under `~/.config` follow automatically — Raspberry Pi Connect survived intact.

**Hostname**, if you also want to change it:

```bash
sudo hostnamectl set-hostname pi
sudo sed -i 's/\bolduser\b/pi/g' /etc/hosts
```

Cloud-init resets the hostname on *every* boot, not just the first — so disable it, or set `preserve_hostname: true`.

### Better blocklists

A stock Pi-hole scores around 68% on [adblock.turtlecute.org](https://adblock.turtlecute.org/) (which tests hostname resolution, so it reflects what DNS blocking actually does — unlike tests that count rendered ad slots, where DNS blocking scores poorly by design).

Adding curated lists from [firebog.net](https://v.firebog.net/hosts/lists.php) gets you to ~85%. These are the low-false-positive ones:

```
https://adaway.org/hosts.txt
https://v.firebog.net/hosts/AdguardDNS.txt
https://raw.githubusercontent.com/anudeepND/blacklist/master/adservers.txt
https://pgl.yoyo.org/adservers/serverlist.php?hostformat=hosts&showintro=0&mimetype=plaintext
https://raw.githubusercontent.com/FadeMind/hosts.extras/master/add.2o7Net/hosts
https://urlhaus.abuse.ch/downloads/hostfile/
https://phishing.army/download/phishing_army_blocklist_extended.txt
```

**Hold off on** EasyList and EasyPrivacy (converted from browser filter lists, they overreach at the domain level), frogeye's first-party trackers (breaks logins and checkouts), and Admiral (breaks anti-adblock sites).

Bulk-add via the Lists page, or:

```bash
sudo apt-get install -y sqlite3
for u in "url1" "url2" ; do
  sudo sqlite3 /etc/pihole/gravity.db \
    "INSERT OR IGNORE INTO adlist (address, enabled, comment) VALUES ('$u', 1, 'firebog');"
done
sudo pihole -g
```

When something breaks, find the domain in Query Log and `pihole allow thedomain.com`.

### Reducing SD card wear

Given this board's history, keeping logs out of the SD card is worthwhile:

```bash
echo "deb [signed-by=/usr/share/keyrings/azlux.gpg] http://packages.azlux.fr/debian/ stable main" \
  | sudo tee /etc/apt/sources.list.d/azlux.list
sudo wget -O /usr/share/keyrings/azlux.gpg https://azlux.fr/repo.gpg
sudo apt update && sudo apt install -y log2ram
sudo reboot
```

It only takes effect after a reboot:

```bash
findmnt -no FSTYPE,SIZE,USED /var/log    # want tmpfs
```

Trade-off: logs flush to disk hourly, so an unclean power loss costs up to an hour of logs.

### Other worthwhile bits

**Local DNS records** — Pi-hole → Settings → Local DNS Records. Map `pi.home → 192.168.1.218` and stop typing IPs.

**Back up your config** — Settings → Teleporter → Export. Restores lists, whitelist and settings onto a fresh install in one click. Do this before you need it.

**Automatic security updates:**

```bash
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

**Drop the desktop** on a headless box — worth ~200-400 MB on a 1 GB board:

```bash
sudo systemctl set-default multi-user.target
```

Note this disables Raspberry Pi Connect's **screen sharing**, which needs a logged-in desktop session. Screen sharing also requires autologin — a running display manager sitting at the greeter isn't enough, because the greeter runs as its own user and there's no Wayland session for uid 1000:

```bash
sudo raspi-config nonint do_boot_behaviour B4   # desktop autologin
```

### What this hardware can't do

For anyone tempted by a bigger project: [Immich](https://immich.app/) (self-hosted Google Photos) needs **6 GB RAM minimum, 8 GB recommended**. A Pi 3 B has 1 GB. Home Assistant, Nextcloud and Jellyfin are similarly out of reach. A Pi 5 (8 GB) with an external SSD, or a used mini PC, is the realistic hardware for those.

---

## Final setup

| Component | Role |
|---|---|
| **Pi 3 B (1 GB)** | Ethernet, static IP, new 5.1 V/2.5 A supply |
| **Pi-hole** | DNS filtering, curated blocklists |
| **Unbound** | Recursive resolver, DNSSEC validated |
| **Tailscale** | Filtering on any network, remote SSH + admin |
| **Gateway IPv6** | Disabled — closes the bypass |

Query path: **client → Pi-hole (filter) → unbound (recursive) → authoritative nameservers.** No third-party resolver sees the traffic.

## What I'd tell myself at the start

1. **Get the data off first.** `debugfs` is read-only, needs no kernel extension, and took four minutes. Everything afterwards was optional because that was already safe.
2. **Read the LEDs.** Red-steady-with-dark-ACT localises a Pi fault to before the card is even read. It would have pointed at power immediately.
3. **Suspect the cable.** 26 AWG power conductors are the single most common cause of Pi instability, and the symptoms look like everything except power.
4. **Distinguish local send errors from timeouts.** `sendto: No route to host` means *your own machine* refused. I spent two hours blaming a network that was working perfectly.
5. **Capture packets before concluding.** Logs and inference produced three wrong theories about DHCP. One `tcpdump` settled it in minutes — and also overturned a conclusion I'd already stated confidently.
6. **Check IPv6 early.** It silently defeated Pi-hole while every IPv4 test passed.
7. **Know when to stop.** Network-wide DHCP was genuinely impossible on this gateway. Tailscale delivered more practical value than the thing I'd originally set out to build.

An 11-year-old board, a $10 power supply, and a weekend. It now filters DNS for every device I own, anywhere in the world, and nothing about my browsing leaves the house.

---

# Update — twelve days later

Everything above describes the setup as it stood on day one, running at home on my own broadband. Since then I added two more Tailscale features, and then moved the Pi onto a university network I don't administer — which broke it in an instructive way and taught me the single most useful command in this whole project.

Appending rather than rewriting, because the mistakes are the point.

> **Placeholders, as before.** `<PI_TS_IP>` is the Pi's Tailscale address and `<UNIVERSITY_IP>` its address on the institutional network. Home addresses (`192.168.1.x`) stay concrete, since they're the same on most home networks.

## Part 10 — Exit nodes and subnet routes

Two Tailscale features I'd skipped initially. Both need one prerequisite that fails silently if you forget it.

### Enable IP forwarding first

```bash
printf 'net.ipv4.ip_forward = 1\nnet.ipv6.conf.all.forwarding = 1\n' \
  | sudo tee /etc/sysctl.d/99-tailscale.conf
sudo sysctl -p /etc/sysctl.d/99-tailscale.conf
```

Without this, both features appear configured and simply don't route.

### Advertise them

```bash
sudo tailscale set --advertise-exit-node --advertise-routes=192.168.1.254/32
```

`tailscale set` preserves your other settings, unlike `tailscale up`, which resets unmentioned flags to defaults. I learned that the hard way — an unrelated `tailscale up` silently reverted a client-side setting I'd changed minutes earlier.

Then **approve them in the admin console** — Machines → your device → Edit route settings. Advertising alone does nothing; they stay dormant until approved. The device won't appear in `tailscale exit-node list` on other machines until you do.

Verify what's actually advertised:

```bash
tailscale debug prefs | grep -A6 '"AdvertiseRoutes"'
```

Confusingly, the exit node shows up as `0.0.0.0/0` and `::/0` in that list — there's no separate flag. And `ExitNodeID` being empty is normal; that field means "am I *using* someone else's exit node", not "am I offering one".

### What an exit node actually changes

I'd assumed the DNS filtering I already had was most of the benefit. It isn't — they're different scopes.

**DNS only (Tailscale without an exit node):**

```
phone → café WiFi → the internet directly
          ↓
       DNS queries only → Pi-hole
```

Ads are blocked, but the café's router still sees **which sites you connect to**. Domain names leak in the TLS handshake, and destination IPs are visible regardless. HTTPS hides content, not destinations.

**With an exit node:**

```
phone → encrypted tunnel → your Pi → your home internet → the internet
```

The local network sees one encrypted connection and nothing else.

| | DNS only | Exit node |
|---|---|---|
| Ad blocking | ✅ | ✅ |
| Local network sees destinations | **yes** | no |
| Apparent IP | the café's | **your home** |
| Speed | unaffected | capped by home upload |

That "apparent IP" row is more useful than it sounds — banks that flag unfamiliar addresses stop complaining, and anything on a home-IP allowlist keeps working.

### The costs, which are real

**Latency scales with distance from home.** Same city, 10–30 ms and unnoticeable. Across a continent, 200–400 ms and genuinely unpleasant. Every request detours to your house and back.

**Captive portals break.** Hotel and café login pages need to intercept your traffic *before* you have internet. With the tunnel up, your traffic never reaches them, and it looks like the WiFi is broken. Turn the exit node off, log in, turn it back on.

**You lose the local network.** No AirPlay to a hotel TV, no printing at an office.

**It does not save mobile data.** I assumed routing through home broadband would spare my cellular allowance. It doesn't — the bytes still travel over cellular to *reach* home. WireGuard's headers mean you use about 4–6% *more*. What actually saves mobile data is the ad blocking, which works with the exit node off.

So it's a toggle, not a setting: on for untrusted WiFi, off on cellular and at home.

### Subnet routes: advertise a /32, not a /24

A subnet route lets your Tailnet reach devices that can't run Tailscale themselves — a router admin page, a NAS, an IP camera.

The obvious move is advertising your whole LAN:

```bash
--advertise-routes=192.168.1.0/24
```

Don't. `192.168.1.0/24` is the most common home range there is, so the moment you're on another network using it — a hotel, a friend's house — your device has two conflicting meanings for the same address and routing gets ambiguous.

Advertise only what you need:

```bash
--advertise-routes=192.168.1.254/32
```

Almost everything else on a home network turns out not to be worth reaching remotely anyway. AirPlay, Chromecast, HomeKit and Sonos discovery all depend on **mDNS multicast, which doesn't cross subnet routing at all** — so an Apple TV gains nothing from it. What does work is anything reached by IP: web admin pages, SSH, file shares. In my case that was exactly one address, the router.

## Part 11 — Moving the Pi to a network I don't control

A faster connection became available — university Ethernet — so I moved the Pi. It vanished completely.

### The mistake: a static IP is network-specific

Part 5 has this:

```bash
sudo nmcli connection modify netplan-eth0 ipv4.method manual \
  ipv4.addresses 192.168.1.218/24 ipv4.gateway 192.168.1.254
```

Correct at home. On a different network it's worse than useless — wrong subnet, and a gateway that doesn't exist. The Pi had no working network at all: no DHCP, no internet, no Tailscale. Invisible, with no way in except a keyboard and monitor.

The fix, run at the Pi's keyboard:

```bash
sudo nmcli connection modify netplan-eth0 ipv4.method auto
sudo nmcli connection modify netplan-eth0 ipv4.dns "127.0.0.1"
sudo reboot
```

**The lesson: you don't need a static LAN IP when you have Tailscale.** The Tailscale address is bound to the *device*, not the network:

```
LAN address:        192.168.1.218 → <UNIVERSITY_IP>   (changed)
Tailscale address:  <PI_TS_IP>    → <PI_TS_IP>        (unchanged)
```

Every reference I'd set up — the DNS nameserver in the admin console, my SSH shortcuts — pointed at the Tailscale address and needed no edit at all. Use DHCP for the LAN and the Tailscale IP for everything else, and moving the machine becomes a non-event.

### MAC registration, and macOS hiding MACs

Managed networks often require registering a device's MAC before the port works. On the Pi:

```bash
ip -br link show eth0
ip -br link show wlan0
```

Raspberry Pi MACs never randomise and both begin with `b8:27:eb`, the Foundation's OUI. If WiFi was disabled earlier, `nmcli radio wifi on` brings `wlan0` back so you can read it.

Getting the equivalent from a Mac is harder than it should be. **macOS 26 masks MAC addresses** — `ifconfig` returns `02:00:00:00:00:00` for every interface, even under `sudo`. The working command is:

```bash
networksetup -listallhardwareports
```

Two traps there. A USB Ethernet adapter's MAC belongs to **the adapter, not the computer**, so swapping docks means re-registering. And if **Private Wi-Fi Address** is enabled, macOS presents a different random MAC per network — register the hardware address and it won't match. Turn it off for that network first, in Wi-Fi → Details.

### What to switch off on someone else's network

**The exit node.** It makes your machine a VPN gateway routing outside traffic in and out through their connection. Most university acceptable-use policies prohibit exactly that, and the usual consequence is losing network access rather than a warning.

**Stale subnet routes.** Mine still advertised the router address from my old home network — a route to nowhere that would misdirect traffic if I ever encountered that address elsewhere.

```bash
sudo tailscale set --advertise-exit-node=false --advertise-routes=
```

Note this runs on the Pi, not the client. `--advertise-*` configures what *that* device offers; `--accept-dns` and `--exit-node` are client-side choices.

**The open resolver.** Part 7 sets `dns.listeningMode ALL` so Tailscale clients can reach Pi-hole. On a network you don't control, that means answering DNS for anyone who can reach you — and universities scan for open resolvers, because they get harvested for amplification attacks.

A firewall is safer than changing the listening mode, which can stop Pi-hole answering on `127.0.0.1` and break the machine's own DNS:

```bash
sudo apt install -y ufw
sudo ufw allow in on tailscale0    # your own devices
sudo ufw allow in on lo            # Pi-hole ↔ unbound internally
sudo ufw allow 22/tcp              # don't lock yourself out
sudo ufw enable
```

`ufw` blocks incoming by default and leaves outgoing alone, so those three rules become the whole guest list. Run it at the keyboard — `ufw enable` takes effect instantly.

### It connected directly, which I didn't expect

I assumed client isolation would force everything through a relay. It didn't:

```
direct <UNIVERSITY_IP>:41641
round-trip: 5–8 ms
```

Better than at home, where two separate networks in the same building had been relaying through a datacentre 60 km away at ~66 ms. Worth checking rather than assuming:

```bash
tailscale status | grep ' pi '
```

`direct` means peer-to-peer. `relay "xxx"` means it's detouring. The field only appears while a connection is active — an idle peer shows neither, so generate some traffic before reading it.

## Part 12 — The command I wish I'd known on day one

When the Pi was offline, every device that used it for DNS lost the internet. Not "no ad blocking" — no name resolution at all, so nothing loaded. Turning Tailscale on made it worse, because that's what applies the DNS override.

The fix is one flag:

```bash
tailscale set --accept-dns=false
```

That tells **one device** to ignore the DNS configuration the coordination server pushes. You stay connected to your Tailnet, keep SSH and remote access, and fall back to the local network's DNS. You lose ad blocking until you turn it back on:

```bash
tailscale set --accept-dns=true
```

The distinction that makes it work is worth internalising:

```
admin console  →  "use <PI_TS_IP> for DNS"     (server-side, all devices)
--accept-dns   →  "this device honours that"    (client-side, per device)
```

I'd been treating the admin console toggle as the only control, which meant my options were "everything filtered" or "nothing connected". It's per-device, and that changes it from a dependency into a preference.

Check the current state with:

```bash
tailscale debug prefs | grep -i CorpDNS
```

`true` means it's using your Pi-hole.

## Part 13 — Two smaller corrections

**log2ram needs enabling *and* a reboot.** I'd installed it and assumed it was working. It wasn't — `systemctl is-active log2ram` said `inactive` and `/var/log` was still on the SD card. It only mounts tmpfs at boot:

```bash
sudo systemctl enable log2ram
sudo sed -i 's/^SIZE=.*/SIZE=64M/' /etc/log2ram.conf
sudo sed -i 's/^MAIL=.*/MAIL=false/' /etc/log2ram.conf
sudo reboot
findmnt -no FSTYPE,SIZE /var/log    # want: tmpfs 64M
```

The default 128 MB is a large slice of a 1 GB board; 64 MB is plenty. `MAIL=false` stops it trying to email a machine with no mail transport configured.

**Passwordless sudo was never configured**, despite `sudo -n true` appearing to succeed. That was sudo's credential cache from a recent password entry, not a rule. `/etc/sudoers.d/` was empty of any NOPASSWD entry, because the cloud-init config had `sudo: null`. Worth checking in a *fresh* session before concluding anything about sudo behaviour.

## Where it stands now

| | |
|---|---|
| Location | University Ethernet, DHCP, no static IP |
| Tailscale | Direct peer-to-peer, ~7 ms |
| Pi-hole + unbound | Running, blocking verified |
| Exit node / subnet routes | Off — not appropriate on a network I don't run |
| Escape hatch | `--accept-dns=false`, per device |

## What the move taught me

1. **A static IP is a liability on any machine that might move.** Tailscale gives you a permanent address that doesn't care about the network. Use DHCP for the LAN and the Tailscale IP for everything else.
2. **Know your escape hatch before you need it.** `--accept-dns=false` turns "my whole setup is down" into a ten-second fix. I spent an evening working around a problem that had a one-line answer.
3. **Verify, don't assume, on someone else's network.** I expected client isolation and relaying; I got direct peer-to-peer at 7 ms. I also assumed the university blocked outbound port 53 — it doesn't. Both theories were wrong, and testing took a minute each.
4. **`tailscale up` resets flags you didn't mention.** Use `tailscale set` to change one thing.
5. **Turn off what doesn't belong.** An exit node on institutional infrastructure, a stale route to a network you've left, a DNS resolver answering strangers — none of these announce themselves as problems until they are.
