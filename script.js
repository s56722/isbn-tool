
async function translateToChinese(text) {
  return "【中】" + text;
}

async function fetchFromGoogleBooks(isbn) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.totalItems > 0) {
    const book = data.items[0];
    const info = book.volumeInfo;
    const sale = book.saleInfo;

    return {
      isbn,
      title: info.title || '',
      zhTitle: await translateToChinese(info.title || ''),
      author: info.authors?.join(', ') || '',
      publisher: info.publisher || '',
      year: info.publishedDate || '',
      price: sale.listPrice ? `${sale.listPrice.amount} ${sale.listPrice.currencyCode}` : '無定價資訊',
      source: 'Google Books'
    };
  }
  return null;
}

async function fetchFromOpenLibrary(isbn) {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  const res = await fetch(url);
  const data = await res.json();
  const book = data[`ISBN:${isbn}`];
  if (book) {
    return {
      isbn,
      title: book.title || '',
      zhTitle: await translateToChinese(book.title || ''),
      author: (book.authors || []).map(a => a.name).join(', '),
      publisher: (book.publishers || []).map(p => p.name).join(', '),
      year: book.publish_date || '',
      price: '無定價資訊',
      source: 'Open Library'
    };
  }
  return null;
}

async function searchBooks() {
  const isbns = document.getElementById('isbnList').value.trim().split(/\n+/);
  const tbody = document.getElementById('resultsTable').querySelector('tbody');
  tbody.innerHTML = '';

  for (let isbn of isbns) {
    let result = await fetchFromGoogleBooks(isbn.trim());
    if (!result) {
      result = await fetchFromOpenLibrary(isbn.trim());
    }

    if (result) {
      const tr = document.createElement('tr');
      Object.values(result).forEach(value => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
  }
}

function exportExcel() {
  const table = document.getElementById("resultsTable");
  const wb = XLSX.utils.table_to_book(table, {sheet:"書籍資訊"});
  XLSX.writeFile(wb, "books.xlsx");
}
