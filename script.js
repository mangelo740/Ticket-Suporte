// Gerenciamento do formulário principal
// Redireciona para login se não estiver autenticado
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = 'login.html';
}
document.addEventListener('DOMContentLoaded', function() {
    // Preencher campos com dados do usuário logado
    async function preencherCamposUsuario() {
        const loggedUser = localStorage.getItem('loggedUser');
        const loggedUserArea = localStorage.getItem('loggedUserArea');
        if (loggedUser) {
            try {
                const users = await window.ticketDB.getAllUsers();
                const user = users.find(u => u.name === loggedUser);
                const firstNameInput = document.getElementById('firstName');
                const departmentSelect = document.getElementById('department');
                if (firstNameInput) firstNameInput.value = user ? user.name : loggedUser;
                if (departmentSelect) departmentSelect.value = user ? user.area : (loggedUserArea || '');
            } catch {
                // fallback localStorage
                const firstNameInput = document.getElementById('firstName');
                const departmentSelect = document.getElementById('department');
                if (firstNameInput) firstNameInput.value = loggedUser;
                if (departmentSelect) departmentSelect.value = loggedUserArea || '';
            }
        }
    }
    setTimeout(preencherCamposUsuario, 0);
    const form = document.getElementById('ticketForm');
    const fileInput = document.getElementById('fileInput');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileList = document.getElementById('fileList');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitLoader = document.getElementById('submitLoader');

    let selectedFiles = [];

    // Upload de arquivos
    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileUpload);

    function handleFileUpload(event) {
        const files = Array.from(event.target.files);
        
        files.forEach(file => {
            // Validar tamanho do arquivo (10MB)
            if (file.size > 10 * 1024 * 1024) {
                showToast(`Arquivo ${file.name} é muito grande. Máximo 10MB.`, 'error');
                return;
            }

            // Adicionar arquivo à lista
            const fileObj = {
                file: file,
                name: file.name,
                size: file.size,
                type: file.type,
                preview: null
            };

            // Se for imagem, criar preview
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    fileObj.preview = e.target.result;
                    selectedFiles.push(fileObj);
                    renderFileList();
                };
                reader.readAsDataURL(file);
            } else {
                selectedFiles.push(fileObj);
                renderFileList();
            }
        });

        // Limpar input
        fileInput.value = '';
    }

    function renderFileList() {
        fileList.innerHTML = '';
        
        selectedFiles.forEach((fileObj, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            fileItem.innerHTML = `
                <div class="file-info">
                    ${fileObj.preview ? 
                        `<img src="${fileObj.preview}" alt="Preview" class="file-preview">` :
                        `<i class="fas fa-file" style="color: #3b82f6; font-size: 1.25rem;"></i>`
                    }
                    <div class="file-details">
                        <h4>${fileObj.name}</h4>
                        <p>${(fileObj.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                </div>
                <button type="button" class="remove-file" onclick="removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            fileList.appendChild(fileItem);
        });
    }

    // Remover arquivo
    window.removeFile = function(index) {
        selectedFiles.splice(index, 1);
        renderFileList();
    };

    // Submissão do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validar campos obrigatórios
    const firstName = document.getElementById('firstName').value.trim();
    const priority = document.getElementById('priority').value;
    const department = document.getElementById('department').value;
    const destinationArea = document.getElementById('destinationArea').value;
    const subject = document.getElementById('subject').value.trim();
    const description = document.getElementById('description').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const loggedUser = localStorage.getItem('loggedUser') || 'ANÔNIMO';

        if (!firstName || !priority || !department || !destinationArea || !subject || !description) {
            showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        // Mostrar loading
        submitBtn.disabled = true;
        submitText.style.display = 'none';
        submitLoader.style.display = 'inline';

        try {
            // Criar ticket via API
            const ticketData = {
                firstName,
                priority,
                department,
                destinationArea,
                subject,
                description,
                contact,
                createdBy: loggedUser
            };

            const result = await ticketDB.createTicket(ticketData);

            // Enviar arquivos para o servidor
            const localIp = window.location.hostname;
            for (const arquivo of selectedFiles) {
                const formData = new FormData();
                formData.append('file', arquivo.file);
                formData.append('user', loggedUser);

                await fetch(`http://${localIp}:3001/api/tickets/${result.id}/attachments`, {
                    method: 'POST',
                    body: formData
                });
            }

            showToast(`Chamado ${result.ticketNumber} criado com sucesso!`, 'success');
            form.reset();
            selectedFiles = [];
            renderFileList();
            window.checkDbStatus();
        } catch (error) {
            console.error('Erro ao criar chamado:', error);
            showToast('Erro ao criar chamado. Tente novamente.', 'error');
            window.checkDbStatus();
        } finally {
            submitBtn.disabled = false;
            submitText.style.display = 'inline';
            submitLoader.style.display = 'none';
        }
    });
});

// Função para mostrar toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';
    
    if (type === 'error') {
        toast.classList.add('error');
    } else {
        toast.classList.remove('error');
    }
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}