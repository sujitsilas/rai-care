# SparkHeal lead capture setup

The "Get Updates" form on the website sends each signup to a Google Sheet and emails you the details. There's no database to run and nothing to pay for. Setup takes about 10 minutes, once.

Until you finish step 4, the form still works: it opens the visitor's email app with their details pre-filled and addressed to kanishk@raicare.health.

## 1. Create the Sheet

Sign in to the Google account that should own the leads (ideally your raicare.health account). Create a new Google Sheet named **SparkHeal Leads**.

## 2. Add the script

1. In the Sheet, open **Extensions → Apps Script**.
2. Delete the placeholder code and paste in everything from `Code.gs` in this folder.
3. If leads should go to a different inbox, change `NOTIFY_EMAIL` at the top.
4. Click **Save**.
5. In the function dropdown, choose **setup** and click **Run**.
6. Approve the permission prompt. It asks to edit this spreadsheet and send email as you. If Google shows "Google hasn't verified this app", click **Advanced → Go to (project name)**. That warning is normal for your own scripts.

A **Leads** tab with column headers now appears in the Sheet.

## 3. Deploy it as a web app

1. Click **Deploy → New deployment**.
2. Click the gear icon and choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**. This lets website visitors submit the form; they still can't see the Sheet.
5. Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.

To check it, open that URL in a browser. You should see "SparkHeal lead capture is running."

## 4. Connect the website

In `index.html`, find this line near the bottom:

```js
const LEADS_ENDPOINT = '';
```

Paste your URL between the quotes, then commit and push.

## 5. Test it

Submit the form on the live site with your own details. You should get an email within a minute, and a new row should appear in the Sheet.

## 6. Set up Google Analytics (optional, recommended)

Google Analytics never receives names or emails; Google's terms prohibit that. Each successful signup sends a `generate_lead` event that carries only the role (Clinician, Investor, and so on), so you can see signup counts and the mix of roles.

In GA4 (property G-MZFBTSFLFS):

1. **Admin → Events**: once the first signup has come through, mark `generate_lead` as a **key event**.
2. **Admin → Custom definitions → Create custom dimension**:
   - Dimension name: Lead role
   - Scope: Event
   - Event parameter: `lead_role`

## Tracking where leads come from

Add UTM tags to any link you share, for example:

```
https://<your-site>/?utm_source=drapers&utm_medium=tv&utm_campaign=pitch
```

Each signup's source is saved in the Sheet's UTM columns, and GA reports the traffic source too.

## Good to know

- **Email limits:** Google allows about 100 emails a day from a personal account, or 1,500 from Google Workspace. If you go over, signups are still saved to the Sheet; only the email alert is skipped.
- **Changing the script:** after editing `Code.gs`, go to **Deploy → Manage deployments**, click the pencil icon, choose **Version: New version**, and click **Deploy**. This keeps the same URL, so the website doesn't need updating.
- **Spam:** a hidden "website" field catches simple bots. Submissions that fill it in are silently dropped.
- **Sharing:** share the Sheet with co-founders like any other Google Sheet.
