// Gerenciamento do formulário principal
document.addEventListener('DOMContentLoaded', function() {
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
        const lastName = document.getElementById('lastName').value.trim();
        const department = document.getElementById('department').value;
        const destinationArea = document.getElementById('destinationArea').value;
        const description = document.getElementById('description').value.trim();
        const contact = document.getElementById('contact').value.trim();

        if (!firstName || !lastName || !department || !destinationArea || !description) {
            showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        // Mostrar loading
        submitBtn.disabled = true;
        submitText.style.display = 'none';
        submitLoader.style.display = 'inline';

        try {
            // Processar arquivos
            const filesData = await Promise.all(
                selectedFiles.map(fileObj => {
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            resolve({
                                name: fileObj.name,
                                size: fileObj.size,
                                type: fileObj.type,
                                data: e.target.result
                            });
                        };
                        reader.readAsDataURL(fileObj.file);
                    });
                })
            );

            // Criar ticket
            const ticketData = {
                firstName,
                lastName,
                department,
                destinationArea,
                description,
                contact,
                files: filesData
            };

            const ticketNumber = ticketDB.createTicket(ticketData);
            
            showToast(`Chamado ${ticketNumber} criado com sucesso!`, 'success');
            
            // Limpar formulário
            form.reset();
            selectedFiles = [];
            renderFileList();
            
        } catch (error) {
            console.error('Erro ao criar chamado:', error);
            showToast('Erro ao criar chamado. Tente novamente.', 'error');
        } finally {
            // Ocultar loading
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