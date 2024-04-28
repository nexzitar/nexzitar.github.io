document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to the submit button
    document.getElementById('itemForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission behavior
        updateTable(); // Call the updateTable function when the form is submitted
    });

    async function updateTable() {
        var textareaContent = document.getElementById('inputTextarea').value;
        var items = {};
        var totalAmount = 0;
        var totalValue = 0;
    
        // Parse textarea content
        var lines = textareaContent.split('\n');
        var itemNames = [];
        var itemAmounts = {};
        for (var i = 0; i < lines.length; i++) {
            var parts = lines[i].split('\t');
            var itemName = parts[0].trim(); // Trim whitespace from item name
            var amount = parseFloat(parts[parts.length - 1]) || 1; // Default to 1 if no number found
            if (itemName in items) {
                // If item already exists, add amount to existing amount
                itemAmounts[itemName] += amount;
            } else {
                // If item does not exist, add it to items object and initialize amount
                itemNames.push(itemName);
                itemAmounts[itemName] = amount;
                items[itemName] = true;
            }
            totalAmount += amount;
        }
    
        // Fetch item IDs for all unique item names
        var itemIDs = await fetchItemIDs(itemNames);
    
        // Populate table
        var tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        for (var i = 0; i < itemNames.length; i++) {
            var itemName = itemNames[i];
            var amount = itemAmounts[itemName];
            var itemPrice = prices.find(price => price.type_id === itemIDs[i]);
            var singleValue = itemPrice ? itemPrice.average_price : null;
            if (itemName === "Triglavian Survey Database"){singleValue = 100000;}
            var value = singleValue ? Math.floor(singleValue * amount) : null;
            if (itemPrice && singleValue !== null) {
                totalValue += value;
            }
            var formattedValue = value !== null ? numberWithCommas(value) : 'N/A';
            var row = '<tr><td>' + itemName + '</td><td>' + amount + '</td><td>' + (formattedValue !== 'N/A' ? formattedValue : 'N/A') + '</td></tr>';
            tableBody.innerHTML += row;
        }
    
        // Populate table footer
        var tableFooter = document.getElementById('tableFooter');
        var formattedTotalValue = totalValue !== null ? numberWithCommas(totalValue) : 'N/A';
        var formattedTotalAmount = totalAmount !== null ? numberWithCommas(totalAmount) : 'N/A';
        tableFooter.innerHTML = '<tr><td>Total</td><td>' + formattedTotalAmount + '</td><td>' + formattedTotalValue + '</td></tr>';
    
        // Show table if there are items, otherwise hide it
        var itemTable = document.getElementById('itemTable');
        itemTable.style.display = itemNames.length > 0 ? 'table' : 'none';
    }
    

    async function fetchItemIDs(itemNames) {
        try {
            // Ensure that item names are unique
            const uniqueItemNames = [...new Set(itemNames)];
    
            //console.log('Unique item names array:', uniqueItemNames); // Log unique item names array for debugging
    
            // Fetch item IDs from the server
            const response = await fetch('https://esi.evetech.net/latest/universe/ids/?datasource=tranquility&language=en', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Language': 'en',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(uniqueItemNames)
            });
    
            // Check if the response is OK
            if (!response.ok) {
                throw new Error('Failed to fetch item IDs. Status: ' + response.status);
            }
    
            // Parse the response as JSON
            const data = await response.json();
            console.log('Item IDs:', data); // Log API response for debugging
    
            // Extract item IDs from the response
            const itemIDs = data.inventory_types.map(item => item.id);
            return itemIDs;
        } catch (error) {
            // Log and throw the error
            console.error('Error fetching item IDs:', error);
            throw error; // Re-throw the error to be caught in the caller function
        }
    }
    
    
    // Function to format numbers with commas
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    async function fetchPrices() {
        try {
            const response = await fetch('https://esi.evetech.net/latest/markets/prices/?datasource=tranquility');
            if (!response.ok) {
                throw new Error('Failed to fetch prices');
            }
            const prices = await response.json();
            // console.log('Prices:', prices); // Log prices for debugging
            return prices;
        } catch (error) {
            console.error('Error fetching prices:', error);
            return null;
        }
    }

    // Call fetchPrices function to fetch prices once when the page loads
    let prices = null;
    fetchPrices().then(data => {
        prices = data;
        // Call other functions here to process the fetched prices or update the UI
    });
});
