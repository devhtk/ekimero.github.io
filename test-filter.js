// Test the filtering logic
const lines = [
  { line: "山手線", company: "JR東日本" },
  { line: "中央線", company: "JR東日本" },
  { line: "銀座線", company: "東京メトロ" },
];

const searchQuery = "山";
const selectedCompany = "";

let filtered = lines.slice();
if (searchQuery) {
  const lowerQ = searchQuery.toLowerCase();
  filtered = filtered.filter(l => 
    l.line.toLowerCase().includes(lowerQ) || 
    l.company.toLowerCase().includes(lowerQ)
  );
}
if (selectedCompany) {
  filtered = filtered.filter(l => l.company === selectedCompany);
}

console.log("Input:", { searchQuery, selectedCompany });
console.log("Filtered:", filtered);
