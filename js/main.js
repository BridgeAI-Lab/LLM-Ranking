fetch('data/rankings.json')
    .then(response => response.json())
    .then(data => {
        const table = document.getElementById('ranking-table');
        let html = '<table border="1"><tr><th>Institution</th><th>Area</th><th>Publications</th></tr>';
        data.forEach(row => {
            html += `<tr><td>${row.institution}</td><td>${row.area}</td><td>${row.publications}</td></tr>`;
        });
        html += '</table>';
        table.innerHTML = html;
    })
    .catch(error => console.error('Error loading data:', error));
