document.addEventListener('DOMContentLoaded', () => {
    // --- Get references to HTML elements ---
    const markdownInput = document.getElementById('markdown-input');
    const cssInput = document.getElementById('css-input');
    // Target the iframe instead of a div
    const previewIframe = document.getElementById('preview-iframe');

    // Profile Management Elements (remain the same)
    const profileSelect = document.getElementById('css-profile-select');
    const profileNameInput = document.getElementById('css-profile-name-input');
    const saveProfileButton = document.getElementById('save-css-profile-button');
    const deleteProfileButton = document.getElementById('delete-css-profile-button');

    // LocalStorage Keys (remain the same)
    const CSS_PROFILES_KEY = 'markdownCssProfiles';
    const LAST_SELECTED_PROFILE_KEY = 'markdownLastSelectedProfile';

    let cssProfiles = {}; // Object to hold profiles in memory: { profileName: cssString, ... }

    // --- Core Function to Update IFRAME Preview ---
    function updatePreview() {
        const markdownText = markdownInput.value;
        const customCssText = cssInput.value; // Get CSS from the textarea

        // Ensure iframe is accessible (it might not be immediately ready on very fast loads)
        if (!previewIframe || !previewIframe.contentDocument) {
             console.warn("Preview iframe not ready yet.");
             // Optionally schedule a retry
             // setTimeout(updatePreview, 50);
             return;
        }


        if (typeof marked === 'undefined') {
            // Display error inside the iframe if possible
            try {
                 previewIframe.srcdoc = `<html><head><style>body{margin:10px;}</style></head><body><p style="color: red;">Error: Marked.js library not loaded.</p></body></html>`;
            } catch(e) { console.error("Marked.js not loaded AND couldn't write to iframe."); }
            return;
        }

        try {
            const generatedHtml = marked.parse(markdownText);

            // Construct the full HTML content for the iframe's srcdoc
            // This includes the generated HTML body AND a style tag with the custom CSS
            const iframeContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        /* Basic iframe body reset (optional, but good practice) */
                        body { margin: 15px; font-family: sans-serif; line-height: 1.6; color: #333; }

                        /* Inject User's Custom CSS HERE */
                        ${customCssText}
                    </style>
                </head>
                <body>
                    ${generatedHtml}
                </body>
                </html>
            `;

            // Set the srcdoc attribute. This populates the iframe with isolated content.
            previewIframe.srcdoc = iframeContent;

        } catch (error) {
            console.error("Error parsing Markdown or updating iframe:", error);
             // Display error inside the iframe
            try {
                previewIframe.srcdoc = `<html><head><style>body{margin:10px;}</style></head><body><p style="color: red;">Error parsing Markdown: ${error.message}</p></body></html>`;
            } catch(e) { console.error("Couldn't write error message to iframe."); }
        }
    }

    // --- CSS Profile Management Functions ---

    // Load profiles from localStorage into memory and populate dropdown
    function loadProfiles() {
        const storedProfiles = localStorage.getItem(CSS_PROFILES_KEY);
        try {
            cssProfiles = storedProfiles ? JSON.parse(storedProfiles) : {};
        } catch (e) {
            console.error("Error parsing CSS profiles from localStorage:", e);
            cssProfiles = {}; // Reset to empty if parsing fails
            localStorage.removeItem(CSS_PROFILES_KEY); // Clear corrupted data
        }


        // Optional: Add a default empty profile if none exist
        // if (Object.keys(cssProfiles).length === 0) {
        //     cssProfiles['Default (empty)'] = '/* Default empty style */\nbody { color: #333; }';
        // }

        populateProfileDropdown();

        // Load the last selected profile's CSS into the textarea
        const lastSelected = localStorage.getItem(LAST_SELECTED_PROFILE_KEY);
        let profileToLoad = ''; // Track which CSS content to load

        if (lastSelected && cssProfiles[lastSelected] !== undefined) {
            profileSelect.value = lastSelected;
            profileToLoad = cssProfiles[lastSelected];
        } else if (Object.keys(cssProfiles).length > 0) {
            // Fallback to the first profile if last selected is invalid or doesn't exist
             const firstProfileName = Object.keys(cssProfiles)[0];
             profileSelect.value = firstProfileName;
             profileToLoad = cssProfiles[firstProfileName];
             // Update last selected in storage if it was invalid
             localStorage.setItem(LAST_SELECTED_PROFILE_KEY, firstProfileName);
        } else {
             // No profiles exist
             profileSelect.value = ''; // Select placeholder
             profileToLoad = ''; // Start empty
             localStorage.removeItem(LAST_SELECTED_PROFILE_KEY); // Clear any stale last selection
        }

        cssInput.value = profileToLoad; // Load CSS into textarea

        // Initial preview update needs to wait slightly for iframe to be ready
        // Using setTimeout ensures the iframe is likely initialized
        setTimeout(updatePreview, 0);
    }

    // Update the <select> dropdown options based on cssProfiles object
    function populateProfileDropdown() {
        // Clear existing options except the placeholder
        while (profileSelect.options.length > 1) {
            profileSelect.remove(1);
        }

        // Get profile names and sort them alphabetically (optional)
        const profileNames = Object.keys(cssProfiles).sort((a, b) => a.localeCompare(b));

        // Add options for each profile
        profileNames.forEach(profileName => {
            const option = document.createElement('option');
            option.value = profileName;
            option.textContent = profileName;
            profileSelect.appendChild(option);
        });
    }

    // Save the current content of cssInput under a new profile name
    function saveProfile() {
        const profileName = profileNameInput.value.trim();
        const currentCss = cssInput.value;

        if (!profileName) {
            alert('Please enter a name for the CSS profile.');
            profileNameInput.focus();
            return;
        }

        // Warn if overwriting
        if (cssProfiles[profileName] !== undefined) {
            if (!confirm(`Profile "${profileName}" already exists. Overwrite?`)) {
                return;
            }
        }

        cssProfiles[profileName] = currentCss; // Add or update in memory
        try {
            localStorage.setItem(CSS_PROFILES_KEY, JSON.stringify(cssProfiles)); // Save to localStorage
            localStorage.setItem(LAST_SELECTED_PROFILE_KEY, profileName); // Remember as last selected

            populateProfileDropdown(); // Update dropdown
            profileSelect.value = profileName; // Select the newly saved profile
            profileNameInput.value = ''; // Clear the input field
            alert(`Profile "${profileName}" saved.`);

        } catch (e) {
             console.error("Error saving profiles to localStorage:", e);
             alert("Error saving profile. LocalStorage might be full or inaccessible.");
        }
    }

    // Delete the currently selected profile
    function deleteProfile() {
        const selectedProfile = profileSelect.value;

        if (!selectedProfile) {
            alert('Please select a profile to delete.');
            return;
        }

        if (confirm(`Are you sure you want to delete the profile "${selectedProfile}"?`)) {
            delete cssProfiles[selectedProfile]; // Remove from memory
            try {
                localStorage.setItem(CSS_PROFILES_KEY, JSON.stringify(cssProfiles)); // Update localStorage

                const lastSelected = localStorage.getItem(LAST_SELECTED_PROFILE_KEY);
                if (lastSelected === selectedProfile) {
                     // If we deleted the last used one, clear the memory
                     localStorage.removeItem(LAST_SELECTED_PROFILE_KEY);
                }

                loadProfiles(); // Reload everything to reflect deletion and select appropriate profile
                alert(`Profile "${selectedProfile}" deleted.`);
            } catch (e) {
                console.error("Error deleting profile from localStorage:", e);
                alert("Error deleting profile. LocalStorage might be inaccessible.");
                // Attempt to reload profiles even if delete failed to save, to resync state
                loadProfiles();
            }
        }
    }

    // Handle profile selection change
    function handleProfileSelectChange() {
        const selectedProfile = profileSelect.value;
        if (selectedProfile && cssProfiles[selectedProfile] !== undefined) {
            cssInput.value = cssProfiles[selectedProfile]; // Load CSS into textarea
            localStorage.setItem(LAST_SELECTED_PROFILE_KEY, selectedProfile); // Remember selection
            updatePreview(); // Apply the newly loaded CSS
        } else if (!selectedProfile) {
            // Optionally clear textarea if "-- Select Profile --" is chosen
            // cssInput.value = '';
            // updatePreview();
        }
    }


    // --- Add Event Listeners ---
    markdownInput.addEventListener('input', updatePreview);
    cssInput.addEventListener('input', updatePreview); // Update preview live as CSS is typed

    saveProfileButton.addEventListener('click', saveProfile);
    deleteProfileButton.addEventListener('click', deleteProfile);
    profileSelect.addEventListener('change', handleProfileSelectChange);

    // --- Initial Load ---
    // Load saved profiles and last selected state on page start
    loadProfiles();

}); // End DOMContentLoaded
