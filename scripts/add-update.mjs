import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('--- どこでも駅メロ 更新追加スクリプト ---');

  const date = await question('日付 (例: 2026/04/19) [今日]: ') || new Date().toISOString().split('T')[0].replace(/-/g, '/');
  const title = await question('タイトル: ');
  const description = await question('詳細説明: ');
  const stationsInput = await question('変更駅 (カンマ区切り、空でも可): ');
  
  const stations = stationsInput ? stationsInput.split(',').map(s => s.trim()) : null;

  // 1. Update src/pages/index.astro
  const indexPaths = ['src/pages/index.astro'];
  for (const indexPath of indexPaths) {
    let indexContent = await fs.readFile(indexPath, 'utf8');
    
    const startMarker = '<h2 style="font-size:1.1em; margin:0; font-weight:700;">最近の更新</h2>';
    const endMarker = '</section>';
    
    const startIndex = indexContent.indexOf(startMarker);
    if (startIndex !== -1) {
      const headerEndIndex = indexContent.indexOf('</div>', startIndex) + 6;
      const sectionEndIndex = indexContent.indexOf(endMarker, headerEndIndex);
      
      let newSectionContent = `\n      <p class="meta" style="margin:0 0 12px 0;">${date}</p>\n      <h3 style="font-size: 1.1em; font-weight: 700; margin: 0 0 8px 0; color: var(--text);">${title}</h3>\n      <p style="color: var(--muted); margin: 0; line-height: 1.6;">${description}</p>`;
      
      if (stations) {
        newSectionContent += `\n      <div style="margin-top: 12px; display: flex; gap: 6px; flex-wrap: wrap;">\n        ${stations.map(s => `<span class="badge" style="background: var(--bg);">${s}</span>`).join('\n        ')}\n      </div>`;
      }
      newSectionContent += '\n    ';

      indexContent = indexContent.slice(0, headerEndIndex) + newSectionContent + indexContent.slice(sectionEndIndex);
      await fs.writeFile(indexPath, indexContent);
      console.log('✅ src/pages/index.astro を更新しました');
    } else {
      console.error('❌ src/pages/index.astro の更新セクションが見つかりませんでした');
    }
  }

  // 2. Update src/pages/history.astro
  const historyPath = 'src/pages/history.astro';
  let historyContent = await fs.readFile(historyPath, 'utf8');
  
  const historyDataStart = 'const historyData = [';
  const historyDataStartIndex = historyContent.indexOf(historyDataStart);
  
  if (historyDataStartIndex !== -1) {
    const insertIndex = historyDataStartIndex + historyDataStart.length;
    
    const newEntry = `
  {
    date: "${date}",
    updates: [
      { title: "${title}", description: "${description}"${stations ? `, stations: ${JSON.stringify(stations)}` : ''} }
    ]
  },`;
    
    // Check if the date already exists in the first entry to group them
    // (Simplification: for now just add as a new date entry at the top)
    historyContent = historyContent.slice(0, insertIndex) + newEntry + historyContent.slice(insertIndex);
    await fs.writeFile(historyPath, historyContent);
    console.log('✅ src/pages/history.astro を更新しました');
  } else {
    console.error('❌ src/pages/history.astro の historyData が見つかりませんでした');
  }

  rl.close();
}

main().catch(console.error);
