import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild
} from '@headlessui/react'
import React, { useEffect, useState } from 'react'
import { IoClose } from 'react-icons/io5'
import useUpdateUser from '../../hooks/useUpdateUser'
import { no_image } from '../../consts/images'
import clsx from 'clsx'
import { DateTime } from 'luxon'
import { MdKeyboardArrowDown } from 'react-icons/md'
import { USER_STATUS_TYPES } from '../../utils/userOptions'
import { toast } from 'react-toastify'
import { RiFolderUploadLine } from 'react-icons/ri'
import { useSettingsContext } from '../../contexts/SettingsContext'
import { getAvatarColor } from '../../utils/avatarColors'
import {
  RiEditLine,
  RiDeleteBin6Line,
  RiCloseLine,
  RiCheckLine
} from 'react-icons/ri'
import ActionButton from '../ui/ActionButton'
import SelectField from '../ui/SelectField'
import InputField from '../ui/InputField'

/* ─── DotPattern component ───────────────────────────────────────────────── */
const DotPattern = () => (
  <svg
    className='absolute inset-0 w-full h-full opacity-10 pointer-events-none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <defs>
      <pattern
        id='dots-modal'
        x='0'
        y='0'
        width='20'
        height='20'
        patternUnits='userSpaceOnUse'
      >
        <circle cx='2' cy='2' r='1.5' fill='white' />
      </pattern>
    </defs>
    <rect width='100%' height='100%' fill='url(#dots-modal)' />
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

function UserDetailsModal ({
  isOpen,
  onClose,
  user,
  onUpdate,
  openDeleteModal,
  currentUser
}) {
  const { settings } = useSettingsContext()

  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [subconQuery, setSubconQuery] = useState('')

  const { updateUserFunction, isLoading } = useUpdateUser()

  const isAdminTarget = user?.role === 'admin' || user?.role === 'head_admin'

  const filteredSubcons = settings.trucksDrivers.subcon.filter(subcon =>
    subcon.toLowerCase().includes(subconQuery.toLowerCase())
  )

  const handleChange = e => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  const handleComboboxChange = (name, value) => {
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
      onUpdate(result.data.user)
      toast.success(result.data.message)
      setIsEditMode(false)
      onClose()
    } else {
      toast.error(result.error)
    }
  }

  const handleCloseModal = () => onClose()

  const handleCancelEditMode = () => {
    setIsEditMode(false)
    setEditForm(user)
    setSelectedFile(null)
    setPreviewImage(null)
  }

  useEffect(() => {
    if (isOpen && user) {
      setEditForm(user)
      setIsEditMode(false)
      setSelectedFile(null)
      setPreviewImage(null)
    }
  }, [isOpen, user])

  const roleLabel =
    editForm.role === 'admin' ||
    editForm.role === 'head_admin' ||
    editForm.role === 'finance'
      ? 'Admin'
      : editForm.role === 'visitor'
      ? 'Visitor'
      : 'Subcon'

  const fullName = `${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim()
  const initials = `${user?.firstname?.[0] ?? ''}${
    user?.lastname?.[0] ?? ''
  }`.toUpperCase()
  const avatarColor = getAvatarColor(fullName)
  const hasImage = previewImage || user?.imageUrl

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = e => {
      if (e.key === 'Escape') handleCloseModal()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog onClose={() => {}} className='relative z-50'>
        <TransitionChild
          as={React.Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <DialogBackdrop className='fixed inset-0 bg-black/40 backdrop-blur-sm' />
        </TransitionChild>

        <div className='fixed inset-0 flex items-center justify-center p-4 max-md:p-2'>
          <TransitionChild
            as={React.Fragment}
            enter='duration-500 ease-out'
            enterFrom='-translate-y-full opacity-0'
            enterTo='translate-y-0 opacity-100'
            leave='duration-400 ease-in'
            leaveFrom='translate-y-0 opacity-100'
            leaveTo='-translate-y-full opacity-0'
          >
            <DialogPanel
              className={clsx(
                'font-poppins w-full max-w-4xl rounded-xl bg-white shadow-lg overflow-hidden flex flex-col md:flex-row md:max-h-none'
              )}
            >
              {/* ══ LEFT PANEL — avatar + meta info ══════════════════════════════ */}
              <div
                className='relative flex flex-col md:items-center md:justify-center overflow-hidden md:w-64 shrink-0 p-6 max-md:p-4'
                style={{
                  background:
                    'linear-gradient(155deg, #020617 0%, #001e36 55%, #0f172a 100%)'
                }}
              >
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

                <div className='relative z-10 w-full flex flex-row md:flex-col md:items-center gap-4'>
                  {/* Avatar */}
                  <div
                    className={clsx(
                      'relative aspect-square rounded-md overflow-hidden transition-all shrink-0',
                      'w-18 md:w-full md:max-w-none',
                      isEditMode ? 'cursor-pointer group' : ''
                    )}
                  >
                    {hasImage ? (
                      <img
                        src={previewImage || user?.imageUrl || no_image}
                        alt={user?.firstname}
                        className={clsx(
                          'w-full h-full object-cover object-center transition-opacity',
                          { 'opacity-10': !previewImage && !user?.imageUrl }
                        )}
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
                    <div className='flex flex-col items-start'>
                      <span className='text-white/50 text-xxxs max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5'>
                        Last Login
                      </span>
                      <span className='text-white/90 text-xs max-md:text-[0.6rem] font-medium'>
                        {user?.lastLogin
                          ? DateTime.fromISO(user.lastLogin).toFormat(
                              'MMM d, yyyy'
                            )
                          : '—'}
                      </span>
                    </div>

                    <div className='flex flex-col items-end'>
                      <span className='text-white/50 text-xxxs max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5'>
                        Logins
                      </span>
                      <span className='text-white/90 text-xs max-md:text-[0.6rem] font-medium'>
                        {user?.loginCount ?? 0}
                      </span>
                    </div>

                    <div className='flex flex-col items-start'>
                      <span className='text-white/50 text-xxxs max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5'>
                        {user?.role === 'admin' || user?.role === 'head_admin'
                          ? 'Created'
                          : 'Approved'}
                      </span>
                      <span className='text-white/90 text-xs max-md:text-[0.6rem] font-medium'>
                        {user?.createdAt
                          ? DateTime.fromISO(user.createdAt).toFormat(
                              'MMM d, yyyy'
                            )
                          : '—'}
                      </span>
                    </div>

                    <div className='flex flex-col items-end'>
                      <span className='text-white/50 text-xxxs max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5'>
                        Updated
                      </span>
                      <span className='text-white/90 text-xs max-md:text-[0.6rem] font-medium'>
                        {user?.updatedAt
                          ? DateTime.fromISO(user.updatedAt).toFormat(
                              'MMM d, yyyy'
                            )
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ══ RIGHT PANEL — form fields ════════════════════════════════════ */}
              <div className='flex-1 flex flex-col min-w-0 overflow-y-auto'>
                {/* Header */}
                <div className='flex items-start justify-between px-6 pt-5 pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3 border-b border-gray-200 shrink-0'>
                  <div>
                    <h2 className='text-gray-900 font-bold text-base max-md:text-sm'>
                      {roleLabel} Details
                    </h2>
                    {isEditMode ? (
                      <p className='text-orange-500 text-xxs mt-0.5'>
                        Make changes and save to update.
                      </p>
                    ) : (
                      <p className='text-gray-400 text-xxs mt-0.5'>
                        View this user's information.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleCloseModal}
                    disabled={isLoading}
                    className='text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-md text-lg transition-all cursor-pointer disabled:opacity-40 shrink-0 ml-4'
                  >
                    <IoClose />
                  </button>
                </div>

                {/* Form */}
                <form
                  onSubmit={handleUpdateUser}
                  className='flex-1 flex flex-col'
                >
                  <div className='flex-1 px-6 py-5 max-md:px-4 max-md:pt-4 grid grid-cols-2 gap-x-4 gap-y-4 max-md:gap-x-3 max-md:gap-y-3 content-start'>
                    {/* visitor modal */}
                    {['visitor'].includes(editForm?.role) && (
                      <>
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

                        <InputField
                          label='Role'
                          type='text'
                          name='role'
                          placeholder='Role'
                          value={editForm?.role || ''}
                          disabled={true}
                          onChange={handleChange}
                          isCapitalize={false}
                        />

                        <SelectField
                          label='Status'
                          name='status'
                          value={editForm?.status || ''}
                          onChange={handleChange}
                          disabled={!isEditMode || isLoading}
                        >
                          <option value='' disabled>
                            Select status
                          </option>
                          {USER_STATUS_TYPES.map((s, i) => (
                            <option key={i} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </SelectField>
                      </>
                    )}

                    {/* subcon modal */}
                    {['subcon'].includes(editForm?.role) && (
                      <>
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

                        <InputField
                          label='Phone No.'
                          type='tel'
                          name='phoneNo'
                          placeholder='-'
                          value={editForm?.phoneNo || ''}
                          disabled={!isEditMode || isLoading}
                          onChange={handleChange}
                        />

                        <SelectField
                          label='Subcon'
                          name='subcon'
                          value={editForm?.subcon || ''}
                          onChange={e =>
                            handleComboboxChange('subcon', e.target.value)
                          }
                          disabled={!isEditMode || isLoading}
                        >
                          <option value='' disabled>
                            Select subcon
                          </option>
                          {settings.trucksDrivers.subcon.map((subcon, i) => (
                            <option key={i} value={subcon}>
                              {subcon}
                            </option>
                          ))}
                        </SelectField>

                        <SelectField
                          label='Status'
                          name='status'
                          value={editForm?.status || ''}
                          onChange={handleChange}
                          disabled={!isEditMode || isLoading}
                        >
                          <option value='' disabled>
                            Select status
                          </option>
                          {USER_STATUS_TYPES.map((s, i) => (
                            <option key={i} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </SelectField>
                      </>
                    )}

                    {/* admin modal */}
                    {['head_admin', 'admin', 'finance'].includes(
                      editForm?.role
                    ) && (
                      <>
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

                        <InputField
                          label='Phone No.'
                          type='tel'
                          name='phoneNo'
                          placeholder='-'
                          value={editForm?.phoneNo || ''}
                          disabled={!isEditMode || isLoading}
                          onChange={handleChange}
                        />

                        <div className='col-span-full grid grid-cols-2 gap-x-4 gap-y-4 max-md:gap-x-3 max-md:gap-y-3'>
                          <SelectField
                            label='Role'
                            name='role'
                            value={editForm?.role || ''}
                            onChange={handleChange}
                            disabled={
                              !isEditMode || isLoading || !isAdminTarget
                            }
                          >
                            <option value='admin'>Admin</option>
                            <option value='head_admin'>Head Admin</option>
                          </SelectField>

                          <SelectField
                            label='Status'
                            name='status'
                            value={editForm?.status || ''}
                            onChange={handleChange}
                            disabled={!isEditMode || isLoading}
                          >
                            <option value='' disabled>
                              Select status
                            </option>
                            {USER_STATUS_TYPES.map((s, i) => (
                              <option key={i} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </SelectField>
                        </div>
                      </>
                    )}

                    {/* Password fields */}
                    <div
                      className={clsx(
                        'col-span-2 grid grid-cols-2 gap-x-4 max-md:gap-x-3 overflow-hidden',
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
                        label='Password'
                        type='password'
                        name='password'
                        placeholder='New password'
                        value={editForm?.password || ''}
                        disabled={!isEditMode || isLoading}
                        onChange={handleChange}
                        isCapitalize={false}
                        required={false}
                      />
                      <InputField
                        label='Confirm Password'
                        type='password'
                        name='confirmPassword'
                        placeholder='Confirm password'
                        value={editForm?.confirmPassword || ''}
                        disabled={!isEditMode || isLoading}
                        onChange={handleChange}
                        isCapitalize={false}
                        required={false}
                      />
                    </div>
                  </div>

                  {/* ── Actions ── */}
                  {['head_admin'].includes(currentUser?.role) && (
                    <div className='px-6 pb-5 pt-4 max-md:px-4 max-md:pb-4 border-t border-gray-200 shrink-0'>
                      {isEditMode ? (
                        <div className='flex gap-2'>
                          <ActionButton
                            icon={RiCloseLine}
                            color='gray'
                            onClick={handleCancelEditMode}
                            title='Cancel'
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
                          />
                          <ActionButton
                            icon={RiDeleteBin6Line}
                            color='red'
                            onClick={openDeleteModal}
                            title='Delete'
                          />
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}

export default UserDetailsModal
