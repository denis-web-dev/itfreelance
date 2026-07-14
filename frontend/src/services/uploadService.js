// services/uploadService.js (или внутри компонента)

const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await fetch('http://localhost:5000/api/users/avatar', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');

    const data = await response.json();
    return data.avatarUrl; // ← URL загруженного аватара
  } catch (error) {
    console.error('Ошибка загрузки аватара:', error);
    return null;
  }
};
