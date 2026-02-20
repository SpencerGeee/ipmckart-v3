// Helper function for collapsible shipping form — accept event param
  function toggleCollapse(sectionId, event) {
      const content = document.getElementById(sectionId);
      const checkbox = document.getElementById('shipDifferent');
      // guard in case event is not passed
      const icon = event && event.currentTarget ? event.currentTarget.querySelector('.toggle-icon') : document.querySelector('.toggle-icon');

      if (!content) return;

      if (content.style.maxHeight && content.style.maxHeight !== '0px') {
          content.style.maxHeight = null;
          if (checkbox) checkbox.checked = false;
          if (icon) {
              icon.classList.remove('fa-chevron-up');
              icon.classList.add('fa-chevron-down');
          }
      } else {
          content.style.maxHeight = content.scrollHeight + "px";
          if (checkbox) checkbox.checked = true;
          if (icon) {
              icon.classList.remove('fa-chevron-down');
              icon.classList.add('fa-chevron-up');
          }
      }
  }