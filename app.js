document.addEventListener('DOMContentLoaded', () => {
    // --- Get references to HTML elements ---
    const markdownInput = document.getElementById('markdown-input');
    const cssInput = document.getElementById('css-input');
    const htmlPreview = document.getElementById('html-preview');
    // Optional: Raw HTML output element
    // const rawHtmlOutput = document.getElementById('raw-html-output');

    // --- Create a dedicated style tag for custom CSS ---
    // This tag will be added to the <head> and updated with user CSS
    const customCssStyleTag = document.createElement('style');
    customCssStyleTag.id = 'custom-user-styles';
    document.head.appendChild(customCssStyleTag);

    // LocalStorage Key
    const CSS_STORAGE_KEY = 'customMarkdownConverterCss';

    // --- Function to update HTML preview and apply CSS ---
    function updatePreview() {
        // Get current markdown and CSS content
        const markdownText = markdownInput.value;
        const customCssText = cssInput.value;

        // Check if Marked library is loaded
        if (typeof marked === 'undefined') {
            htmlPreview.innerHTML = '<p style="color: red;">Error: Marked.js library not loaded.</p>';
            console.error("Marked.js library not loaded!");
            return;
        }

        try {
            // Convert Markdown to HTML using Marked.js
            // Basic usage. Add options here if needed (e.g., marked.parse(markdownText, { breaks: true }); )
            const generatedHtml = marked.parse(markdownText);

            // Update the preview pane's content
            htmlPreview.innerHTML = generatedHtml;

            // Optional: Update the raw HTML output
            // if (rawHtmlOutput) {
            //     rawHtmlOutput.value = generatedHtml;
            // }

            // Update the content of our dedicated style tag
            customCssStyleTag.textContent = customCssText;

            // --- Save Custom CSS to localStorage ---
            localStorage.setItem(CSS_STORAGE_KEY, customCssText);

        } catch (error) {
            htmlPreview.innerHTML = `<p style="color: red;">Error parsing Markdown: ${error.message}</p>`;
            console.error("Error parsing Markdown:", error);
        }
    }

    // --- Function to Load Saved CSS from localStorage ---
    function loadSavedData() {
        const savedCss = localStorage.getItem(CSS_STORAGE_KEY);

        if (savedCss !== null) { // Check for null explicitly, as empty string is valid
            cssInput.value = savedCss;
        }
        // Maybe load saved markdown too? Uncomment if desired
        // const savedMarkdown = localStorage.getItem('lastMarkdownInput');
        // if (savedMarkdown) {
        //     markdownInput.value = savedMarkdown;
        // }

        // Initial update on load to apply saved CSS and render any initial markdown
        updatePreview();
    }

    // --- Add event listeners ---
    // Update preview whenever markdown or CSS input changes
    markdownInput.addEventListener('input', updatePreview);
    cssInput.addEventListener('input', updatePreview);

    // --- Initial load ---
    loadSavedData();

}); // End DOMContentLoaded