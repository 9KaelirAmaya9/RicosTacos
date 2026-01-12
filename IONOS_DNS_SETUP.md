# IONOS DNS Setup for Vercel

## Step-by-Step Guide to Configure losricostacos.com

### Step 1: Log into IONOS
1. Go to https://www.ionos.com/
2. Click "Login" (top right)
3. Sign in with your account credentials

### Step 2: Access Domain Settings
1. After logging in, go to **"Domains & SSL"** in the menu
2. Find **losricostacos.com** in your domain list
3. Click on the domain name or the gear icon next to it
4. Select **"DNS"** or **"Manage DNS"**

### Step 3: EDIT the Existing A Record for Root Domain
**IMPORTANT:** You already have an A record pointing to `216.198.79.1` (IONOS parking page)

1. Find the A record with **Host Name:** `@`
2. Click the **pencil/edit icon** next to it
3. Change the **VALUE** from `216.198.79.1` to `76.76.21.21`
4. Click **"Save"**

### Step 4: EDIT the Existing CNAME Record for WWW
**IMPORTANT:** You already have a CNAME record for www

1. Find the CNAME record with **Host Name:** `www`
2. It should already point to something like `0916bf87c4ad0b32.vercel-dns-017.com`
3. **This is correct!** - This is your project-specific Vercel DNS address
4. **DO NOT CHANGE IT** - Leave it exactly as Vercel provided

**Note:** Each Vercel project gets a unique CNAME value. Use the exact value shown in your Vercel dashboard, NOT the generic `cname.vercel-dns.com`

### Step 5: Remove Conflicting Records (If Any)
**Important:** Check if there are any existing records that might conflict:
- Delete any other A records pointing to different IPs
- Delete any CNAME records for `@` (root)
- Delete any AAAA records (IPv6) unless needed
- Keep only MX records (email), TXT records (verification), and the ones you just added

### Step 6: Verify Your Settings
Your DNS records should look like this:

```
Type    Host    Value                                TTL
----    ----    -----                                ---
A       @       76.76.21.21                         3600
CNAME   www     0916bf87c4ad0b32.vercel-dns-017.com 3600
```

**Note:** Your CNAME value will be different - use the exact one Vercel shows you in your dashboard!

### Step 7: Wait for Propagation
- DNS changes can take 5-60 minutes (IONOS is usually fast)
- Sometimes up to 24-48 hours for full global propagation
- You can check status at: https://dnschecker.org

### Step 8: Retry in Vercel
1. Go to your Vercel Dashboard
2. Click **Settings** → **Domains**
3. Find **losricostacos.com**
4. Click **"Refresh"** or **"Retry"** to regenerate SSL certificate

## Troubleshooting

### Error: "Record already exists"
- IONOS might have default parking page records
- You need to **delete or replace** the existing A record
- Make sure you're editing, not adding a duplicate

### Error: "Invalid value"
- Make sure you're using `@` not the full domain name
- For CNAME, use `cname.vercel-dns.com` (no trailing dot)
- Check for any extra spaces

### IONOS Specific Issues
- Some IONOS plans have "DNS Management" locked
- If you can't edit DNS, you may need to upgrade your plan or contact IONOS support
- Check if "IONOS Name Servers" are active (not external name servers)

## Alternative: Use Vercel Name Servers (Advanced)
If DNS editing is restricted, you can point your entire domain to Vercel's nameservers:
1. In Vercel, go to Settings → Domains
2. Look for "Use Vercel DNS" option
3. You'll get nameserver addresses like:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
4. In IONOS, change nameservers to these Vercel ones

**Note:** This method gives Vercel full DNS control and removes IONOS DNS limitations.

## Verification Commands
After setup, test from your terminal:

```bash
# Check if A record is set
dig losricostacos.com +short

# Should return: 76.76.21.21

# Check if CNAME is set
dig www.losricostacos.com +short

# Should return: cname.vercel-dns.com
```

## Need Help?
- IONOS Support: https://www.ionos.com/help
- IONOS DNS Documentation: Search for "IONOS DNS management"
- Vercel DNS Help: https://vercel.com/docs/projects/domains

---

**Status:** Waiting for DNS setup completion
**Last Updated:** January 12, 2026
