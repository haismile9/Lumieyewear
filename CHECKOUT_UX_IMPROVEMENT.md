# Checkout UX Improvement - Đăng nhập thông minh

## 📋 Tổng quan

Đã cải thiện trải nghiệm checkout cho người dùng đã đăng nhập với các tính năng:

### ✨ Tính năng mới

1. **Auto-select địa chỉ mặc định**
   - Khi vào trang checkout, tự động chọn địa chỉ mặc định (nếu có)
   - Không cần user phải chọn lại mỗi lần đặt hàng

2. **Ẩn form khi đã chọn địa chỉ**
   - Form fields được ẩn đi khi user chọn địa chỉ có sẵn
   - Giảm clutter, tập trung vào thông tin quan trọng

3. **Preview địa chỉ đã chọn**
   - Hiển thị box màu xanh với thông tin địa chỉ giao hàng
   - Dấu ✓ và icon 📞 cho dễ nhìn
   - Nút "Chỉnh sửa" để unlock form

4. **Edit mode thông minh**
   - Click "Chỉnh sửa" → Mở khóa form để điều chỉnh
   - Warning amber box: "Thay đổi chỉ áp dụng cho đơn hàng này"
   - Không lưu vào database (chỉ cho order hiện tại)

5. **UX cải tiến cho saved addresses**
   - Radio button lớn hơn (h-4 w-4)
   - Font-weight semibold cho tên
   - Badge "Mặc định" dạng pill màu xanh
   - Hover effect rõ ràng
   - Icon ➕ cho "Địa chỉ mới"

## 🎯 User Flow

### A. User đã đăng nhập + có địa chỉ mặc định:

```
Vào trang checkout
   ↓
✅ Địa chỉ mặc định tự động được chọn
   ↓
✅ Preview box hiển thị thông tin giao hàng
   ↓
✅ Form fields bị ẩn (clean UI)
   ↓
User click "Đặt hàng" → Hoàn tất
```

### B. User muốn thay đổi địa chỉ:

```
Click nút "Chỉnh sửa"
   ↓
Form fields xuất hiện
   ↓
⚠️ Warning: "Thay đổi chỉ áp dụng cho đơn hàng này"
   ↓
Điều chỉnh thông tin
   ↓
Click "Đặt hàng"
```

### C. User muốn dùng địa chỉ khác:

```
Click vào địa chỉ khác trong danh sách
   ↓
✅ Auto-fill thông tin
   ↓
✅ Preview box cập nhật
   ↓
✅ Form bị ẩn
   ↓
Click "Đặt hàng"
```

### D. User muốn nhập địa chỉ mới:

```
Click "➕ Sử dụng địa chỉ mới"
   ↓
Form fields xuất hiện
   ↓
Nhập thông tin đầy đủ
   ↓
Click "Đặt hàng"
```

## 🔧 Implementation Details

### State Management

```typescript
const [selectedAddressId, setSelectedAddressId] = useState<string>('');
const [useNewAddress, setUseNewAddress] = useState(false);
const [isEditingAddress, setIsEditingAddress] = useState(false); // NEW
```

### Auto-select Default Address

```typescript
useEffect(() => {
  if (addressesData?.data && addressesData.data.length > 0 && !selectedAddressId && !useNewAddress) {
    const defaultAddress = addressesData.data.find((addr: any) => addr.isDefault);
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
    }
  }
}, [addressesData, selectedAddressId, useNewAddress]);
```

### Lock Form when Address Selected

```typescript
useEffect(() => {
  if (selectedAddressId && addressesData?.data) {
    const address = addressesData.data.find((addr: any) => addr.id === selectedAddressId);
    if (address) {
      // Auto-fill form
      setFormData(...);
      setUseNewAddress(false);
      setIsEditingAddress(false); // ← Lock form
    }
  }
}, [selectedAddressId, addressesData]);
```

### Conditional Rendering

```tsx
{/* Show preview when address selected and not editing */}
{selectedAddressId && !isEditingAddress && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    {/* Preview content */}
    <button onClick={() => setIsEditingAddress(true)}>
      Chỉnh sửa
    </button>
  </div>
)}

{/* Show form only when: editing OR new address OR no selection OR guest */}
{(useNewAddress || isEditingAddress || !selectedAddressId || !user) && (
  <div className="space-y-4">
    {/* Form fields */}
  </div>
)}
```

## 🎨 UI Components

### Address Preview Box

```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-4">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <p className="text-sm font-medium text-green-900 mb-2">
        ✓ Giao hàng đến:
      </p>
      <p className="font-semibold text-gray-900">
        {formData.firstName} {formData.lastName}
      </p>
      <p className="text-sm text-gray-700 mt-1">
        {formData.address1}
        {formData.address2 && `, ${formData.address2}`}
      </p>
      <p className="text-sm text-gray-700">
        {formData.city}
        {formData.district && `, ${formData.district}`}
      </p>
      <p className="text-sm text-gray-700 mt-1">
        📞 {formData.phone}
      </p>
    </div>
    <button
      type="button"
      onClick={() => setIsEditingAddress(true)}
      className="ml-4 text-sm text-blue-600 hover:text-blue-800 font-medium underline"
    >
      Chỉnh sửa
    </button>
  </div>
</div>
```

### Edit Warning

```tsx
{selectedAddressId && isEditingAddress && (
  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
    <p className="text-sm text-amber-800">
      💡 Bạn đang chỉnh sửa thông tin địa chỉ. Thay đổi sẽ chỉ áp dụng cho đơn hàng này.
    </p>
  </div>
)}
```

### Saved Address Cards

```tsx
<div
  className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
    selectedAddressId === address.id
      ? 'border-black bg-gray-50 shadow-md'
      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
  }`}
  onClick={() => setSelectedAddressId(address.id)}
>
  <div className="flex items-start gap-3">
    <input
      type="radio"
      className="mt-1 h-4 w-4"
      checked={selectedAddressId === address.id}
      onChange={() => setSelectedAddressId(address.id)}
    />
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="font-semibold text-base">
          {address.firstName} {address.lastName}
        </p>
        {address.isDefault && (
          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-medium">
            Mặc định
          </span>
        )}
      </div>
      {/* Address details */}
    </div>
  </div>
</div>
```

## 📊 Benefits

### Before (Old UX)
- ❌ Phải chọn địa chỉ mỗi lần checkout
- ❌ Form luôn hiển thị đầy đủ → rối mắt
- ❌ Không rõ địa chỉ nào đang được sử dụng
- ❌ Cần scroll xuống để xem form
- ❌ Trải nghiệm như guest user

### After (New UX)
- ✅ Địa chỉ mặc định tự động chọn
- ✅ Form ẩn đi khi đã chọn địa chỉ
- ✅ Preview box rõ ràng, dễ nhìn
- ✅ Nút "Chỉnh sửa" linh hoạt
- ✅ UI gọn gàng, tập trung
- ✅ Checkout nhanh chóng hơn

## 🚀 Testing

### Test Cases

1. **User đã đăng nhập, có địa chỉ mặc định**
   - ✅ Địa chỉ mặc định tự động được chọn
   - ✅ Preview box hiển thị
   - ✅ Form bị ẩn

2. **User đã đăng nhập, không có địa chỉ mặc định**
   - ✅ Hiển thị danh sách địa chỉ
   - ✅ Chọn địa chỉ bất kỳ → Preview + ẩn form

3. **User đã đăng nhập, không có địa chỉ nào**
   - ✅ Form hiển thị ngay
   - ✅ Không hiển thị section "Địa chỉ đã lưu"

4. **Click "Chỉnh sửa"**
   - ✅ Form xuất hiện
   - ✅ Warning box hiển thị
   - ✅ Giữ nguyên selectedAddressId

5. **Click "Sử dụng địa chỉ mới"**
   - ✅ Clear selectedAddressId
   - ✅ Form xuất hiện
   - ✅ setUseNewAddress(true)

6. **Guest user (chưa đăng nhập)**
   - ✅ Form hiển thị ngay
   - ✅ Không có section "Địa chỉ đã lưu"

## 📝 Notes

- Thay đổi từ "Chỉnh sửa" **không lưu vào database**
- Chỉ áp dụng cho order hiện tại
- Nếu muốn lưu địa chỉ mới, user cần vào Account Settings → Addresses

## 🔄 Future Improvements

1. **Save address option**: Checkbox "Lưu địa chỉ này" khi dùng địa chỉ mới
2. **Quick edit**: Inline edit trong preview box
3. **Address autocomplete**: Google Places API
4. **Map picker**: Chọn địa chỉ trên bản đồ
5. **Recent addresses**: Hiển thị 3 địa chỉ gần nhất

---

**Updated**: January 12, 2026  
**File**: `components/checkout/checkout-form.tsx`  
**Status**: ✅ Completed & Tested
