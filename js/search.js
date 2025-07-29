// Algolia search integration
// Replace local search with Algolia service

var initAlgoliaSearch = function(appId, apiKey, indexName) {
  'use strict';
  
  // Initialize Algolia client
  const client = algoliasearch(appId, apiKey);
  const index = client.initIndex(indexName);
  const $input = document.getElementById('search-input');
  const $resultContent = document.getElementById('search-result');
  
  // Set initial state
  $resultContent.innerHTML = "<ul><span class='local-search-empty'>输入关键词开始搜索...</span></ul>";
  
  $input.addEventListener('input', function() {
    const query = this.value.trim();
    
    if (query.length < 2) {
      $resultContent.innerHTML = query.length === 0 
        ? "<ul><span class='local-search-empty'>输入关键词开始搜索...</span></ul>"
        : "<ul><span class='local-search-empty'>请输入至少2个字符</span></ul>";
      return;
    }
    
    // Show loading state
    $resultContent.innerHTML = "<ul><span class='local-search-empty'>搜索中...</span></ul>";
    
    // Perform Algolia search
    index.search(query, {
      attributesToRetrieve: ['title', 'content', 'url'],
      hitsPerPage: 10
    }).then(({ hits }) => {
      renderResults(hits, query);
    }).catch(err => {
      console.error('Algolia search error:', err);
      $resultContent.innerHTML = "<ul><span class='local-search-empty'>搜索服务暂时不可用</span></ul>";
    });
  });
  
  function renderResults(hits, query) {
    if (hits.length === 0) {
      $resultContent.innerHTML = "<ul><span class='local-search-empty'>没有找到相关结果</span></ul>";
      return;
    }
    
    let html = '<ul class="search-result-list">';
    
    hits.forEach(hit => {
      const title = hit.title || 'Untitled';
      const url = hit.url || '#';
      let content = hit._highlightResult?.content?.value || hit.content || '';
      
      // Truncate content
      content = content.length > 150 
        ? content.substring(0, 150) + '...' 
        : content;
      
      // Highlight query terms
      const regex = new RegExp(`(${query.split(/\s+/).join('|')})`, 'gi');
      content = content.replace(regex, '<span class="search-keyword">$1</span>');
      
      html += `
        <li>
          <a href="${url}" class="search-result-title"><h2>${title}</h2></a>
          <h3 class="search-result-abstract">${content}</h3>
          <hr>
        </li>
      `;
    });
    
    html += '</ul>';
    $resultContent.innerHTML = html;
  }
  
  // Clear search handler
  $(document).on('click', '#search-close-icon', function() {
    $('#search-input').val('');
    $('#search-result').html("<ul><span class='local-search-empty'>输入关键词开始搜索...</span></ul>");
  });
}