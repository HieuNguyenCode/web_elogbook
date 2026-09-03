const fs = require('fs');
let code = fs.readFileSync('src/pages/owners/OwnerList.tsx', 'utf-8');

// import useToast
code = code.replace("import { axiosClient } from '../../utils/axiosClient';", "import { axiosClient } from '../../utils/axiosClient';\nimport { useToast } from '../../components/ToastContext';");

// inject useToast hook
code = code.replace("const [selectedOwner, setSelectedOwner] = useState<ShipOwner | null>(null);", "const [selectedOwner, setSelectedOwner] = useState<ShipOwner | null>(null);\n    const { success, error: showError } = useToast();");

// remove alerts from handleModalSubmit
code = code.replace("alert('Thêm chủ tàu thành công!');", "success('Thêm chủ tàu thành công!');");
code = code.replace("alert('Cập nhật thông tin thành công!');", "success('Cập nhật thông tin thành công!');");

// fix alerts in handleDelete
code = code.replace("alert('Xóa thành công!');", "success('Xóa chủ tàu thành công!');");
code = code.replace(/alert\('Lỗi khi xóa: '[^)]*\);/, "showError('Xóa chủ tàu thất bại!');");

fs.writeFileSync('src/pages/owners/OwnerList.tsx', code);
