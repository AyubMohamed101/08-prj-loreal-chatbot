# Project 8: L'Oréal Chatbot

L’Oréal is exploring the power of AI, and your job is to showcase what's possible. Your task is to build a chatbot that helps users discover and understand L’Oréal’s extensive range of products—makeup, skincare, haircare, and fragrances—as well as provide personalized routines and recommendations.

## 🚀 Launch via GitHub Codespaces

1. In the GitHub repo, click the **Code** button and select **Open with Codespaces → New codespace**.
2. Once your codespace is ready, open the `index.html` file via the live preview.

## ☁️ Connect the Cloudflare Worker

The browser must call a Cloudflare Worker so the OpenAI API key is never exposed
in this public frontend. Do not create a `secrets.js` file and do not put an API
key in any file in this repository.

### 1. Create the Worker

1. Create a Cloudflare Worker from the Cloudflare dashboard.
2. Copy the code from [`RESOURCE_cloudflare-worker.js`](./RESOURCE_cloudflare-worker.js)
   into the Worker editor and deploy it.
3. Add your API key to Cloudflare Secrets Store with the name `MY_API_KEY`.
   Configure the Worker binding as `MY_API_KEY`, as shown in your
   `secrets_store_secrets` configuration. Paste the key there, not into this
   repository.
4. Copy the deployed Worker URL.

### 2. Connect this website

Open [`script.js`](./script.js) and replace
`PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE` with the deployed Worker URL.
Then open `index.html` in the live preview and send a test message.

The website sends a `messages` array to the Worker. The Worker sends that
conversation to OpenAI and the website reads the reply from
`data.choices[0].message.content`.

Enjoy building your L’Oréal beauty assistant! 💄
