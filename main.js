import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import MarkdownIt from 'markdown-it';
import './style.css';

const API_KEY_PLACEHOLDER = 'TODO';
const API_KEY_STORAGE_KEY = 'api_key';
const geminiModel = "gemini-pro-vision";
const harmSettings = [{
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
}];

const form = document.querySelector('form');
const promptInput = document.querySelector('input[name="prompt"]');
const output = document.querySelector('.output');
const imageUploadInput = document.getElementById('image-upload');

form.onsubmit = async (ev) => {
    ev.preventDefault();
    output.textContent = 'Generating...';

    try {
        if (!imageUploadInput.files || !imageUploadInput.files[0]) {
            throw new Error("Please upload an image.");
        }

        const file = imageUploadInput.files[0];
        const imageBase64 = await getImageBase64(file);

        const contents = [{
            role: 'user',
            parts: [
                { inline_data: { mime_type: file.type, data: imageBase64 } },
                { text: promptInput.value }
            ]
        }];

        const result = await generateContent(contents);
        displayContent(result);
    } catch (e) {
        handleError(e);
    }
};

async function getImageBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function generateContent(contents) {
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({ model: geminiModel, safetySettings: harmSettings });
    const result = await model.generateContentStream({ contents });
    const buffer = [];
    for await (let response of result.stream) {
        buffer.push(response.text());
    }
    return buffer;
}

function displayContent(content) {
    const md = new MarkdownIt();
    output.innerHTML = md.render(content.join(''));
}

function showApiKeyBanner() {
    const apiKey = window.prompt("To get started with the Gemini API, please enter your API key:");
    if (apiKey) {
        sessionStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
        console.log('API key stored in cache memory:', apiKey);
        maybeShowApiKeyBanner();
    }
}

function maybeShowApiKeyBanner() {
    const apiKey = getApiKey();
    const banner = document.querySelector('.api-key-banner');
    banner.style.display = apiKey === API_KEY_PLACEHOLDER ? 'block' : 'none';
}

function getApiKey() {
    return sessionStorage.getItem(API_KEY_STORAGE_KEY) || API_KEY_PLACEHOLDER;
}

function handleError(error) {
    output.innerHTML = `Error: ${error.message}`;
}

maybeShowApiKeyBanner();
