import React, { useEffect, useState } from 'react'
import { useUserContext } from '../../contexts/UserContext'
import clsx from 'clsx'
import { DateTime } from 'luxon'
import { no_image } from '../../consts/images'
import { FaSave } from 'react-icons/fa'
import useUpdateUser from '../../hooks/useUpdateUser'
import { RiFolderUploadLine } from 'react-icons/ri'
import { toast } from 'react-toastify'
import PageHeader from '../../components/PageHeader'
import { getAvatarColor } from '../../utils/avatarColors'
import { RiEditLine, RiCloseLine, RiCheckLine } from 'react-icons/ri'
import ActionButton from '../../components/ui/ActionButton'

/* ─── Decorative dot pattern ────────────────────────────────────────────── */
const DotPattern = () => (
  <svg
    className='absolute inset-0 w-full h-full opacity-10 pointer-events-none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <defs>
      <pattern
        id='dots-profile'
        x='0'
        y='0'
        width='20'
        height='20'
        patternUnits='userSpaceOnUse'
      >
        <circle cx='2' cy='2' r='1.5' fill='white' />
      </pattern>
    </defs>
    <rect width='100%' height='100%' fill='url(#dots-profile)' />
  </svg>
)

/* ─── Status badge colours ──────────────────────────────────────────────── */
const userStatusStyles = {
  active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  pending: 'bg-orange-50 text-orange-500 border-orange-100',
  inactive: 'bg-red-50 text-red-500 border-red-100',
  rejected: 'bg-gray-100 text-gray-500 border-gray-200',
  revoked: 'bg-gray-100 text-gray-500 border-gray-200'
}

/* ─── Reusable InputField ───────────────────────────────────────────────── */
const InputField = ({
  label,
  type,
  name,
  placeholder,
  value,
  onChange,
  disabled,
  isRequired = true,
  isCapitalize = true
}) => (
  <label className='flex flex-col gap-1.5'>
    <span className='text-xxs sm:text-xxs font-semibold text-gray-600 uppercase tracking-wider'>
      {label} {isRequired && <span className='text-red-400'>*</span>}
    </span>
    <div
      className={clsx(
        'flex items-center border rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 transition-all duration-200',
        disabled
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-200 focus-within:border-gray-400'
      )}
    >
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value || ''}
        minLength={2}
        maxLength={50}
        onChange={onChange}
        disabled={disabled}
        required={isRequired}
        className={clsx(
          'flex-1 text-xs max-sm:text-xxs placeholder-gray-400 bg-transparent focus:outline-none min-w-0',
          disabled ? 'text-gray-500' : 'text-gray-800',
          { capitalize: isCapitalize }
        )}
      />
    </div>
  </label>
)

function MyProfile () {
  const { updateUserFunction, isLoading } = useUpdateUser()
  const { userData, updateUser } = useUserContext()
  const userLoading = userData.isLoading

  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)

  const user = userData?.data

  const handleChange = e => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewImage(URL.createObjectURL(file))
      setEditForm(prev => ({ ...prev, image: file }))
    }
  }

  const handleUpdateUser = async e => {
    e.preventDefault()
    const result = await updateUserFunction(user._id, editForm)
    if (result.success) {
      toast.success(result.data.message)
      setEditForm(result.data.user)
      updateUser(result.data.user)
      setIsEditMode(false)
      setSelectedFile(null)
      setPreviewImage(null)
    } else {
      toast.error(result.error)
    }
  }

  const handleCancelEditMode = () => {
    setIsEditMode(false)
    setEditForm(user)
    setSelectedFile(null)
    setPreviewImage(null)
  }

  useEffect(() => {
    if (user) {
      setEditForm(user)
      setIsEditMode(false)
      setSelectedFile(null)
      setPreviewImage(null)
    }
  }, [user])

  const roleLabel =
    user?.role === 'admin' || user?.role === 'head_admin'
      ? 'Admin'
      : user?.role === 'visitor'
      ? 'Visitor'
      : 'Subcon'

  const fullName = `${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim()
  const initials = `${user?.firstname?.[0] ?? ''}${
    user?.lastname?.[0] ?? ''
  }`.toUpperCase()
  const avatarColor = getAvatarColor(fullName)
  const hasImage = previewImage || user?.imageUrl

  if (userLoading) {
    return (
      <div className='flex-1 flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4 text-center'>
          <span className='loading loading-spinner loading-lg text-primaryColor' />
          <p className='text-gray-500 text-sm font-medium'>
            Loading content...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex-1 flex flex-col gap-4 sm:gap-6'>
      {/* ── Page heading ──────────────────────────────────────────────── */}
      <PageHeader
        header={'My Profile'}
        subheader={'View and manage your personal information'}
      />

      <div className='relative flex-1 overflow-y-auto scrollbar-thin'>
        <div className='flex flex-col lg:flex-row gap-4 sm:gap-6 absolute top-0 left-0 right-0'>
          {/* ══ LEFT — dark identity panel ════════════════════════════════ */}
          <div
            className='relative flex flex-col overflow-hidden rounded-xl lg:w-64 shrink-0 p-6 max-md:p-4'
            style={{
              background:
                'linear-gradient(155deg, #020617 0%, #001e36 55%, #0f172a 100%)'
            }}
          >
            {/* Radial glows */}
            <div
              className='absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-10 pointer-events-none'
              style={{
                background:
                  'radial-gradient(circle, #475569 0%, transparent 70%)'
              }}
            />
            <div
              className='absolute -bottom-12 -left-12 w-44 h-44 rounded-full opacity-10 pointer-events-none'
              style={{
                background:
                  'radial-gradient(circle, #334155 0%, transparent 70%)'
              }}
            />

            <DotPattern />

            {/* Container: row on mobile, column on desktop */}
            <div className='relative z-10 w-full flex flex-row lg:flex-col md:items-center gap-4'>
              {/* Avatar */}
              <div
                className={clsx(
                  'relative aspect-square rounded-md overflow-hidden transition-all shrink-0',
                  'w-18 md:w-32 lg:w-full',
                  isEditMode ? 'cursor-pointer group' : ''
                )}
              >
                {hasImage ? (
                  <img
                    src={previewImage || user?.imageUrl || no_image}
                    alt={user?.firstname}
                    className='w-full h-full object-cover object-center'
                  />
                ) : (
                  <div
                    className={clsx(
                      'w-full h-full flex items-center justify-center border-2',
                      avatarColor.bg,
                      avatarColor.border
                    )}
                  >
                    <span
                      className={clsx(
                        'font-bold text-4xl md:text-5xl',
                        avatarColor.text
                      )}
                    >
                      {initials}
                    </span>
                  </div>
                )}
                {isEditMode && (
                  <>
                    <div className='absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 group-hover:transition-opacity text-white gap-1'>
                      <RiFolderUploadLine className='text-xl max-md:text-base' />
                      <span className='text-xxs font-medium max-md:hidden'>
                        Change
                      </span>
                    </div>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleFileChange}
                      className='absolute inset-0 opacity-0 cursor-pointer'
                    />
                  </>
                )}
              </div>

              {/* Meta info */}
              <div className='flex-1 w-full grid grid-cols-2 items-end place-content-stretch md:gap-y-3 md:gap-x-2'>
                {/* Last Login */}
                <div className='flex flex-col items-start'>
                  <span className='text-white/50 text-[0.5rem] max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5'>
                    Last Login
                  </span>
                  <span className='text-white/90 text-xs max-md:text-[0.6rem] font-medium'>
                    {user?.lastLogin
                      ? DateTime.fromISO(user.lastLogin).toFormat('MMM d, yyyy')
                      : '—'}
                  </span>
                </div>

                {/* Login Count */}
                <div className='flex flex-col items-end'>
                  <span className='text-white/50 text-[0.5rem] max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5'>
                    Logins
                  </span>
                  <span className='text-white/90 text-xs max-md:text-[0.6rem] font-medium'>
                    {user?.loginCount ?? 0}
                  </span>
                </div>

                {/* Created / Requested */}
                <div className='flex flex-col items-start'>
                  <span className='text-white/50 text-[0.5rem] max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5'>
                    {user?.role === 'admin' ||
                    user?.role === 'head_admin' ||
                    user?.role === 'finance'
                      ? 'Created'
                      : 'Requested'}
                  </span>
                  <span className='text-white/90 text-xs max-md:text-[0.6rem] font-medium'>
                    {user?.createdAt
                      ? DateTime.fromISO(user.createdAt).toFormat('MMM d, yyyy')
                      : '—'}
                  </span>
                </div>

                {/* Updated At */}
                <div className='flex flex-col items-end'>
                  <span className='text-white/50 text-[0.5rem] max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5'>
                    Updated
                  </span>
                  <span className='text-white/90 text-xs max-md:text-[0.6rem] font-medium'>
                    {user?.updatedAt
                      ? DateTime.fromISO(user.updatedAt).toFormat('MMM d, yyyy')
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ══ RIGHT — form panel ════════════════════════════════════════ */}
          <div className='flex-1 flex flex-col min-w-0 border border-gray-200 rounded-xl bg-white overflow-y-auto'>
            {/* Header */}
            <div className='px-6 pt-5 pb-4 max-sm:px-4 max-sm:pt-4 max-sm:pb-3 border-b border-gray-200 shrink-0'>
              <h2 className='text-gray-900 font-bold text-base max-sm:text-sm'>
                {roleLabel} Details
              </h2>

              {isEditMode ? (
                <p className='text-orange-500 text-xxs mt-0.5'>
                  Make changes and save to update.
                </p>
              ) : (
                <p className='text-gray-400 text-xxs mt-0.5'>
                  Your personal and account information.
                </p>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateUser} className='flex-1 flex flex-col'>
              <div className='flex-1 px-6 py-5 max-sm:px-4 max-sm:pt-4 grid grid-cols-2 gap-x-4 gap-y-4 max-sm:gap-x-3 max-sm:gap-y-3 content-start'>
                <InputField
                  label='First Name'
                  type='text'
                  name='firstname'
                  placeholder='First name'
                  value={editForm?.firstname || ''}
                  disabled={!isEditMode || isLoading}
                  onChange={handleChange}
                />
                <InputField
                  label='Last Name'
                  type='text'
                  name='lastname'
                  placeholder='Last name'
                  value={editForm?.lastname || ''}
                  disabled={!isEditMode || isLoading}
                  onChange={handleChange}
                />

                <div className='max-sm:col-span-2'>
                  <InputField
                    label='Email'
                    type='email'
                    name='email'
                    placeholder='Email address'
                    value={editForm?.email || ''}
                    disabled={!isEditMode || isLoading}
                    onChange={handleChange}
                    isCapitalize={false}
                  />
                </div>

                <div className='grid grid-cols-2 gap-x-4 gap-y-4 max-sm:gap-x-3 max-sm:gap-y-3 max-sm:col-span-2'>
                  <InputField
                    label='Phone No.'
                    type='tel'
                    name='phoneNo'
                    placeholder='Phone No.'
                    value={editForm?.phoneNo || ''}
                    disabled={!isEditMode || isLoading}
                    onChange={handleChange}
                  />
                  <div className='flex flex-col gap-1.5'>
                    <span className='text-xxs font-semibold text-gray-600 uppercase tracking-wider'>
                      Role
                    </span>
                    <div className='flex items-center bg-gray-50 border border-gray-200 rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5'>
                      <p className='text-xs max-sm:text-xxs text-gray-500 capitalize'>
                        {editForm?.role?.replace(/_/g, ' ') || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Password fields — animated reveal */}
                <div
                  className={clsx(
                    'col-span-2 grid grid-cols-2 gap-x-4 max-sm:gap-x-3 overflow-hidden',
                    !isEditMode && 'pointer-events-none'
                  )}
                  style={{
                    maxHeight: isEditMode ? '120px' : '0px',
                    opacity: isEditMode ? 1 : 0,
                    transition:
                      'max-height 600ms cubic-bezier(0.4,0,0.2,1), opacity 500ms cubic-bezier(0.4,0,0.2,1)'
                  }}
                >
                  <InputField
                    label='New Password'
                    type='password'
                    name='password'
                    placeholder='New password'
                    value={editForm?.password || ''}
                    disabled={!isEditMode || isLoading}
                    onChange={handleChange}
                    isRequired={false}
                    isCapitalize={false}
                  />
                  <InputField
                    label='Confirm Password'
                    type='password'
                    name='confirmPassword'
                    placeholder='Confirm password'
                    value={editForm?.confirmPassword || ''}
                    disabled={!isEditMode || isLoading}
                    onChange={handleChange}
                    isRequired={false}
                    isCapitalize={false}
                  />
                </div>
              </div>

              {/* ── Actions ── */}
              {['head_admin', 'admin'].includes(user?.role) && (
                <div className='px-6 pb-5 pt-4 max-sm:px-4 max-sm:pb-4 border-t border-gray-200 shrink-0'>
                  {isEditMode ? (
                    <div className='flex gap-2'>
                      <ActionButton
                        icon={RiCloseLine}
                        color='gray'
                        onClick={handleCancelEditMode}
                        title='Cancel'
                        disabled={isLoading}
                      />
                      <ActionButton
                        icon={RiCheckLine}
                        color='green'
                        type='submit'
                        title='Save changes'
                        isLoading={isLoading}
                      />
                    </div>
                  ) : (
                    <div className='flex gap-2'>
                      <ActionButton
                        icon={RiEditLine}
                        color='blue'
                        onClick={() => setIsEditMode(true)}
                        title='Edit'
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyProfile
