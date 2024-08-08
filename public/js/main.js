  //import { getAllPosts, getPostById, createPost, deletePost, fetchForms, getCommentsByPostId, addComment, getFormDefinition} from '../../database.js';
  document.addEventListener(`DOMContentLoaded`, ()=>  {

    const viewModal = document.getElementById('myModal');
    //viewmodal declarations  
    const closeViewModalBtn = document.getElementById('closeViewModal');
    const modalTitle = document.getElementById('modal-title');
    const modalForm = document.getElementById('modal-form');
    const modalContent = document.getElementById('mymodal-content');
    const commentsSection = document.getElementById('commentsList');
    const commentForm = document.getElementById('comment-form');
    const commentPostIdInput = document.getElementById('comment-post-id');
    //view modal comments toggling
    const expandComments=document.getElementById('ExpandCollapse');
    const div = document.getElementById('commentsContainer');
    const facont=document.getElementById('plusminus');
    //Archived modal code
    const openArchivedPostsModal = document.getElementById('poemarchives');
    const archivedPostsModal = document.getElementById('archivedPostsModal');
    const closeArchivedPostsModal = document.getElementById('closeArchivedPostsModal');
    const archivedPostsList = document.getElementById('archived-posts-list');
    // Form Modal functionality
    const formModal = document.getElementById('formModal');
    const openFormModalBtn = document.getElementById('openFormModal');
    const closeFormModalBtn = document.getElementById('closeFormModal');
    const body = document.querySelector('body');
    //confirm modal initialization
    const confirmModal = document.getElementById('confirmModal');
    //edit modal initialization
    const editmodal= document.getElementById('editFormModal');
    //initialize the quill editor with desired fonts
    const Font=Quill.import('formats/font');
    Font.whitelist=['Poppins', 'Roboto','Verdana','Open Sans', 'sans-serif'];
    Quill.register(Font,true);
    //editor 
    const quill = new Quill('#editor', {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ 'font': Font.whitelist }, { 'size': [] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'script': 'sub' }, { 'script': 'super' }],
          [{ 'header': '1' }, { 'header': '2' }, 'blockquote', 'code-block'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          [{ 'direction': 'rtl' }],
          [{ 'align': [] }],
          ['link', 'image', 'video'],
          ['clean'] // remove formatting button
        ]
      }
    });

      // Set default font to Roboto
      quill.format('font', 'Poppins');
  
      document.getElementById('post-form').onsubmit = function() {
        document.getElementById('content').value = quill.root.innerHTML;
        console.log(document.getElementById('content').value); // For debugging
      };
      //show new poem modal
      openFormModalBtn.onclick = ()=> {
        formModal.style.display = 'block';
      }
      
      closeFormModalBtn.onclick = function() {
        formModal.style.display = 'none';
      }

      expandComments.addEventListener('click', ()=>{
        div.classList.toggle('expanded');
        div.classList.toggle('collapsible');
        if (div.classList.contains('expanded')) {
          facont.classList.remove('fa-plus');
          facont.classList.add('fa-minus');
          //div.style.display = 'block';
        } else {
          facont.classList.add('fa-plus');
          facont.classList.remove('fa-minus');
          //div.style.display = 'none';
        }
      });

    /*
      View Post Modal functionality
      View post by clicking on the post link 
      */
    document.querySelectorAll('.view-post').forEach(link => {
      link.addEventListener('click', async function(event) {
        event.preventDefault();
        const postId = link.dataset.id;
        const response = await fetch(`/post/`+ postId);
        const post = await response.json();
        if (post) {
          document.getElementById('modal-title').innerText = post.title;
          const formDesc=await fetchFormDesc(post);
          document.getElementById('modalForm').innerText=`${post.form}`;
          document.getElementById('modal-form').innerHTML = `<h5>This poem is a <em><b> ${post.form} </b></em>. What is a ${post.form} poem?</h5> <hr class="divider"> ${formDesc}`;
          document.getElementById('modal-content').innerHTML = post.content;
          commentPostIdInput.value = postId;
          viewModal.style.display = 'block';
          body.classList.add('modal-open');
          await fetchComments(postId);
        }
      });
      });

      //fetch form description from the database
      async function fetchFormDesc(post){
        const formResponse = await fetch(`/formDescription/${encodeURIComponent(post.form)}`);
        const formDesc = await formResponse.json();
        if (formDesc && formDesc.Description) {
          return formDesc.Description;
        }else{
          return 'No description available';
        }
        return formDesc;
      }
      //fetch comments asynchronously
      async function fetchComments(postId) {
        const response = await fetch(`/comments/${postId}`);
        const comments = await response.json();
        commentsSection.innerHTML = comments.map(comment => `
          <div class="comment">
            <p><strong>${comment.author}</strong> (${new Date(comment.timestamp).toLocaleString()}):</p>
            <p>${comment.content}</p>
          </div>
        `).join('');
      }   

      //post comments on the view modal
      commentForm.onsubmit = async function(event) {
        event.preventDefault();
        const postId = commentPostIdInput.value;
        const author = document.getElementById('author').value;
        const content = document.getElementById('comment-content').value;
        await fetch('/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ postId, author, content })
        });
        await fetchComments(postId);
        commentForm.reset();
        //toggle the collapse of the coment form on the view post modal
        div.classList.toggle('expanded');
        div.classList.toggle('collapsible');
      };
  

      // Close the view post modal when clicking the close button
      closeViewModalBtn.onclick = function() {
        viewModal.style.display = 'none';
        window.location.reload(); 
      }

      //add edit functionality
      // Quill editor instance for the edit modal
      const quillEdit = new Quill('#edit-editor', {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'font': Font.whitelist }, { 'size': [] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'header': '1' }, { 'header': '2' }, 'blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'direction': 'rtl' }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean'] // remove formatting button
          ]
        }
      });

      // Function to open the edit modal and populate it with post data
      
      function openEditModal(post) {
        document.getElementById('edit-title').value = post.title;
        document.getElementById('edit-form').value = post.form;
        quillEdit.root.innerHTML = post.content;
        document.getElementById('edit-post-id').value = post.id;
        editmodal.style.display='block';
        //document.getElementById('editFormModal').style.display = 'block';
      }
      // Close the edit modal
      document.getElementById('closeEditFormModal').onclick = () => {
        document.getElementById('editFormModal').style.display = 'none';
      };
      // Handle form submission
      document.getElementById('edit-post-form').onsubmit = () => {
        document.getElementById('edit-content').value = quillEdit.root.innerHTML;
      };
      //add event listeners to archive buttons
      document.querySelectorAll('.archive-post').forEach(btn =>{
        btn.addEventListener('click', async(event)=>{
          //add code to handle archive
          const postid=btn.getAttribute('data-id')
          //send an AJAX request to archve the post
          fetch(`/archive/${postid}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then( response => {
            if(response.ok){
              showDynamicAlert("Poem archived",btn);
              // alert("Poem archived");
              // await fetch("/",);
              window.location.reload();
            } else {
              //change the btn style to alert
              showDynamicAlert("There was an error archiving this poem",btn);
              // alert("There was an error archiving this poem")
            }
          });
        });
      });
      // Add event listeners to edit buttons
      document.querySelectorAll('.edit-post').forEach(button => {
        button.addEventListener('click', async (event) => {
          const postId = button.getAttribute('data-id');

          // Fetch the post data using AJAX
          const response = await fetch(`/post/${postId}`);
          const post = await response.json();

          // Open the edit modal with fetched post data
          openEditModal(post);
        });
      });      

      // Open modal to show archived posts
      openArchivedPostsModal.addEventListener('click', async () => {
        archivedPostsList.innerHTML = ''; // Clear existing content
        try {
          const response = await fetch('/archived-posts');
          const archivedPosts = await response.json();

          archivedPosts.forEach(post => {
            const postDiv = document.createElement('div');
            postDiv.classList.add('archived-post');
            postDiv.classList.add('container');
            postDiv.innerHTML = `
              <div class=" row archiveheader">
                <span class="col"><b>${post.title}</span></b>
                <span class="col">Form: ${post.form}</span>
              </div>
              <span class ="padleft">${post.content}</span>
              <button class="unarchive-button links btn btn-dark btn-sm" data-id="${post.id}">Restore</button>
              <hr>
            `;
            archivedPostsList.appendChild(postDiv);
          });

          archivedPostsModal.style.display = 'block';
        } catch (error) {
          console.error('Error fetching archived posts:', error);
        }
      });

      // Close modal
      closeArchivedPostsModal.addEventListener('click', () => {
        archivedPostsModal.style.display = 'none';
        window.location.reload();
      });

      // Unarchive post
      archivedPostsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('unarchive-button')) {
          const postId = e.target.dataset.id;

          try {
            await fetch(`/unarchive/${postId}`, { method: 'POST' });
            window.location.reload();
            e.target.parentElement.remove();
          } catch (error) {
            console.error('Error unarchiving post:', error);
          }
        }
      });

      // Close modal if clicked outside content
      window.addEventListener('click', (e) => {
        if (e.target === archivedPostsModal) {
          archivedPostsModal.style.display = 'none';
        }
      });      

      // Close the modals when clicking outside of them
      window.onclick = function(event) {
        if (event.target == formModal) {
          // formModal.style.display = 'none';
          // window.location.reload(); 
        } else if (event.target == viewModal) {
          viewModal.style.display = 'none';
          window.location.reload(); 
        }else if (event.target == editmodal){
          // editmodal.style.display='none';
          // window.location.reload(); 
        }else if(event.target==confirmModal){
          viewModal.style.display = 'none';
        }
        
      };
      //delete poem
      document.querySelectorAll(".del-post").forEach(btn=>{
          btn.addEventListener('click',async(event)=>{
            const postid=btn.getAttribute('data-id')
            //set up and show the delete modal
           
            const confirmDeleteButton = document.getElementById('confirm-delete');
            const cancelDeleteButton = document.getElementById('cancel-delete'); 

            //show the confirm delete modal
            confirmModal.style.display = 'block';
            //add the click event to the delete button modal
            confirmDeleteButton.addEventListener('click', () => {
              // Code to delete the post (e.g., AJAX request)
                delPoem(postid);
                console.log("Post deleted!");
                confirmModal.style.display = 'none';
                showDynamicAlert("Poem deleted!",btn);
                window.location.reload();
            });
    
            //if the user cancels add event to the cancel butto and hide the modal
            cancelDeleteButton.addEventListener('click', () => {
                confirmModal.style.display = 'none';
                showDynamicAlert("Delete cancelled!",btn); 
                window.location.reload();
            });
          });
      });
    
    });

    /* show dynamic alert instead of the normal borwser alert */

    function showDynamicAlert(message, targetElement) {
      // Remove any existing alert
      let existingAlert = document.getElementById('dynamic-alert');
      if (existingAlert) {
        existingAlert.remove();
      }
    
      // Create the alert div
      let alertDiv = document.createElement('div');
      alertDiv.id = 'dynamic-alert';
      alertDiv.textContent = message;
      alertDiv.style.position = 'absolute';
      alertDiv.style.padding = '10px';
      alertDiv.style.width="80dwh"
      alertDiv.style.backgroundColor = '#f44336'; // Red background
      alertDiv.style.color = 'white';
      alertDiv.style.borderRadius = '5px';
      alertDiv.style.zIndex = 1000; // Ensure it's above other content
      alertDiv.style.boxShadow = '5px 5px 10px rgba(70, 50, 12, 0.7)';
      alertDiv.style.cursor = 'pointer';
      alertDiv.style.fontFamily=`'Segoe UI',Serif`;
    
      // Position the alert near the target element
      const rect = targetElement.getBoundingClientRect();
      alertDiv.style.left = `${rect.left + window.scrollX}px`;
      alertDiv.style.top = `${rect.bottom + window.scrollY + 5}px`;
    
      // Append the alert to the body
      document.body.appendChild(alertDiv);
    
      // Add click event to remove the alert
      alertDiv.addEventListener('click', function() {
        alertDiv.remove();
      });
    }
    //delete poem via an asynchronous call
    async function delPoem(postId) {
      try {
        const response = await fetch(`/delete/${postId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
    
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
    
        // Handle successful deletion, e.g., update UI
        console.log('Post deleted successfully');
        // Redirect if necessary (could be done here or elsewhere)
        // window.location.href = "/";
      } catch (error) {
        console.error('Error deleting post:', error);
        // Handle error, e.g., display error message to user
      }
    }
    

    