import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-extrabold">الصفحة غير موجودة</h1>
      <Link to="/" className="btn-primary mt-6">العودة إلى الصفحة الرئيسية</Link>
    </div>
  );
}
