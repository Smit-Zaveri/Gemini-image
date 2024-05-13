import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';

let API_KEY = 'AIzaSyCkIIEwyLom_wZqZxkn1vWYVwyBJYIvvyw';

let form = document.querySelector('form');
let promptInput = document.querySelector('input[name="prompt"]');
let output = document.querySelector('.output');
let imageUploadInput = document.getElementById('image-upload');

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Generating...';

  try {
    // Check if an image is uploaded
    if (!imageUploadInput.files || !imageUploadInput.files[0]) {
      output.textContent = "Please upload an image.";
      return;
    }

    // Read the uploaded image as base64
    let file = imageUploadInput.files[0];
    let reader = new FileReader();

    reader.onloadend = async () => {
      let imageBase64 = reader.result.split(',')[1]; // Extracting base64 from the data URL

      // Assemble the prompt by combining the text with the chosen image
      let contents = [
        {
          role: 'user',
          parts: [
            { inline_data: { mime_type: file.type, data: imageBase64, } },
            { text: promptInput.value }
          ]
        }
      ];

      // Call the gemini-pro-vision model, and get a stream of results
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-pro-vision",
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
        ],
      });

      const result = await model.generateContentStream({ contents });

      // Read from the stream and interpret the output as markdown
      let buffer = [];
      let md = new MarkdownIt();
      for await (let response of result.stream) {
        buffer.push(response.text());
        output.innerHTML = md.render(buffer.join(''));
      }
    };

    reader.readAsDataURL(file); // Read the file as data URL
  } catch (e) {
    output.innerHTML += '<hr>' + e;
  }
};

maybeShowApiKeyBanner(API_KEY);