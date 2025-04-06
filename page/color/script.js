document.addEventListener('DOMContentLoaded', function() {
    const colorInput = document.getElementById('color-input');
    const findMatchButton = document.getElementById('find-match');
    const inputColorBox = document.getElementById('input-color');
    const inputHex = document.getElementById('input-hex');
    const resultsSection = document.getElementById('results');
    const matchesContainer = document.getElementById('matches-container');
    
    // 颜色数据
    let colorData = {};
    
    // 加载颜色数据
    fetch('color.json')
        .then(response => response.json())
        .then(data => {
            colorData = data;
        })
        .catch(error => console.error('加载颜色数据失败:', error));
    
    // 实时更新颜色预览
    colorInput.addEventListener('input', function() {
        const hex = this.value.trim();
        if (hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex)) {
            updateColorPreview(hex);
        }
    });
    
    // 查找匹配按钮点击事件
    findMatchButton.addEventListener('click', function() {
        const hex = colorInput.value.trim();
        if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
            alert('请输入有效的6位16进制颜色值');
            return;
        }
        
        updateColorPreview(hex);
        findColorMatches(hex);
    });
    
    // 按Enter键查找匹配
    colorInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            findMatchButton.click();
        }
    });
    
    // 更新颜色预览
    function updateColorPreview(hex) {
        inputColorBox.style.backgroundColor = `#${hex}`;
        inputHex.textContent = `#${hex.toUpperCase()}`;
    }
    
    // 将16进制颜色转换为RGB
    function hexToRgb(hex) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return [r, g, b];
    }
    
    // 计算两个颜色之间的相似度（欧几里得距离）
    function calculateColorSimilarity(color1, color2) {
        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);
        
        const rDiff = rgb1[0] - rgb2[0];
        const gDiff = rgb1[1] - rgb2[1];
        const bDiff = rgb1[2] - rgb2[2];
        
        const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
        return distance;
    }
    
    // 找出最匹配的颜色
    function findColorMatches(inputHex) {
        const matches = [];
        
        for (const [name, hex] of Object.entries(colorData)) {
            const distance = calculateColorSimilarity(inputHex, hex);
            const similarity = 100 - (distance / 4.41) * 100; // 归一化为百分比，最大距离约为441
            matches.push({
                name,
                hex,
                distance,
                similarity: Math.max(0, similarity.toFixed(2))
            });
        }
        
        // 按相似度排序（距离越小越相似）
        matches.sort((a, b) => a.distance - b.distance);
        
        // 取前三个结果
        displayMatches(matches.slice(0, 4));
    }
    
    // 显示匹配结果
    function displayMatches(matches) {
        matchesContainer.innerHTML = '';
        
        matches.forEach(match => {
            const matchElement = document.createElement('div');
            matchElement.className = 'match-item';
            
            matchElement.innerHTML = `
                <div class="match-color" style="background-color: #${match.hex}"></div>
                <div class="match-info">
                    <h3>${match.name}</h3>
                    <p>#${match.hex.toUpperCase()}</p>
                </div>
            `;
            
            matchesContainer.appendChild(matchElement);
        });
        
        resultsSection.style.display = 'block';
    }
});